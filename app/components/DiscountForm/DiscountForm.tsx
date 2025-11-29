import { returnToDiscounts } from "app/utils/navigation";
import { useCallback, useMemo, useState } from "react";
import { Form } from "react-router";

import { useDiscountForm } from "../../hooks/useDiscountForm";
import { DiscountClass } from "../../types/admin.types.d";
import { DiscountMethod } from "../../types/types";
import { ProductPicker } from "../ProductPicker/ProductPicker";

interface SubmitError {
  message: string;
  field: string[];
}

interface DiscountFormProps {
  initialData?: {
    title: string;
    method: DiscountMethod;
    code: string;
    combinesWith: {
      orderDiscounts: boolean;
      productDiscounts: boolean;
      shippingDiscounts: boolean;
    };
    discountClasses: DiscountClass[];
    usageLimit: number | null;
    appliesOncePerCustomer: boolean;
    startsAt: string | Date;
    endsAt: string | Date | null;
    configuration: {
      cartLinePercentage: string;
      orderPercentage: string;
      deliveryPercentage: string;
      metafieldId?: string;
      productIds?: string[];
      quantity: string;
    };
  };
  collections: { id: string; title: string }[];
  isEditing?: boolean;
  submitErrors?: SubmitError[];
  isLoading?: boolean;
  success?: boolean;
}

const methodOptions = [
  { label: "Discount code", value: DiscountMethod.Code },
  { label: "Automatic discount", value: DiscountMethod.Automatic },
];

export function DiscountForm({
  initialData,
  collections: initialCollections,
  isEditing = false,
  submitErrors = [],
  success = false,
}: DiscountFormProps) {
  const { formState, setField, setConfigField, submit } =
    useDiscountForm({
      initialData,
    });

  const [products, setProducts] =
    useState<{ id: string; title: string }[]>([]);

  const errorBanner = useMemo(
    () =>
      submitErrors.length > 0 ? (
        <s-banner tone="critical">
          <p>There were some issues with your form submission:</p>
          <ul>
            {submitErrors.map(({ message, field }, index) => (
              <li key={index}>
                {field.join(".")} {message}
              </li>
            ))}
          </ul>
        </s-banner>
      ) : null,
    [submitErrors],
  );

  const successBanner = useMemo(
    () =>
      success ? (
        <s-banner tone="success">
          <p>Discount saved successfully</p>
        </s-banner>
      ) : null,
    [success],
  );

  const handleProductSelect = useCallback(
    async (selectedProducts: { id: string; title: string }[]) => {
      setConfigField(
        "productIds",
        selectedProducts.map((product) => product.id),
      );
      setProducts(selectedProducts);
    },
    [setConfigField],
  );

  const handleReset = useCallback(() => {
    returnToDiscounts();
  }, []);

  return (
    <Form
      method="post"
      id="discount-form"
      data-save-bar
      onSubmit={submit}
      onReset={handleReset}
    >
      <input
        type="hidden"
        name="discount"
        value={JSON.stringify({
          title: formState.title,
          method: formState.method,
          code: formState.code,
          combinesWith: formState.combinesWith,
          discountClasses: formState.discountClasses,
          usageLimit:
            formState.usageLimit === ""
              ? null
              : parseInt(formState.usageLimit, 10),
          appliesOncePerCustomer: formState.appliesOncePerCustomer,
          startsAt: formState.startDate,
          endsAt: formState.endDate,
          configuration: {
            ...(formState.configuration.metafieldId
              ? { metafieldId: formState.configuration.metafieldId }
              : {}),
            cartLinePercentage: parseFloat(
              formState.configuration.cartLinePercentage,
            ),
            quantity: parseInt(formState.configuration.quantity ?? "1", 10),
            orderPercentage: parseFloat(
              formState.configuration.orderPercentage,
            ),
            deliveryPercentage: parseFloat(
              formState.configuration.deliveryPercentage,
            ),
            productIds: formState.configuration.productIds || [],
          },
        })}
      />
      <s-stack gap="base">
        {errorBanner}
        {successBanner}

        <s-stack gap="base">
          {/* Method section */}
          <s-section heading={isEditing ? "Edit discount" : "Create discount"}>
            <s-select
              label="Discount type"
              value={formState.method}
              onChange={(e: any) =>
                setField("method", e.target.value as DiscountMethod)
              }
              disabled={isEditing}
            >
              {methodOptions.map((option) => (
                <s-option key={option.value} value={option.value}>
                  {option.label}
                </s-option>
              ))}
            </s-select>

            {formState.method === DiscountMethod.Automatic ? (
              <s-text-field
                label="Discount title"
                autocomplete="off"
                value={formState.title}
                onChange={(e: any) => setField("title", e.target.value)}
              />
            ) : (
              <s-text-field
                label="Discount code"
                autocomplete="off"
                value={formState.code}
                onChange={(e: any) => setField("code", e.target.value)}
              />
            )}
          </s-section>

          {/* Discount Configuration */}
          <s-section heading="Discount Configuration">
            <s-stack gap="base">
              <s-number-field
                label="Minimum quantity"
                autocomplete="on"
                min={2}
                value={formState.configuration.quantity ?? "2"}
                onChange={(e: any) =>
                  setConfigField("quantity", e.target.value)
                }
              />
              <s-number-field
                label="Product discount percentage"
                autocomplete="on"
                min={1}
                max={80}
                suffix="%"
                value={formState.configuration.cartLinePercentage}
                onChange={(e: any) =>
                  setConfigField("cartLinePercentage", e.target.value)
                }
              />
              <ProductPicker
                onSelect={handleProductSelect}
                selectedProductIds={
                  formState.configuration.productIds || []
                }
                products={
                  formState.configuration.products || products
                }
                buttonText="Select products for discount"
              />
            </s-stack>
          </s-section>

          {/* Usage limits section */}
          {formState.method === DiscountMethod.Code ? (
            <s-section heading="Usage limits">
              <s-number-field
                label="Usage limit"
                autocomplete="on"
                min={0}
                placeholder="No limit"
                value={formState.usageLimit}
                onChange={(e: any) => setField("usageLimit", e.target.value)}
              />
              <s-checkbox
                label="Limit to one use per customer"
                checked={formState.appliesOncePerCustomer}
                onChange={(e: any) =>
                  setField("appliesOncePerCustomer", e.target.checked)
                }
              />
            </s-section>
          ) : null}
        </s-stack>
      </s-stack>
    </Form>
  );
}
