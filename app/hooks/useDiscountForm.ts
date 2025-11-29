import { useCallback, useState } from "react";
import { useSubmit } from "react-router";

import { DiscountClass } from "../types/admin.types.d";
import { DiscountMethod } from "../types/types";

interface CombinesWith {
  orderDiscounts: boolean;
  productDiscounts: boolean;
  shippingDiscounts: boolean;
}

interface Product {
  id: string;
  title: string;
}

interface DiscountConfiguration {
  quantity: string;
  cartLinePercentage: string;
  orderPercentage: string;
  deliveryPercentage: string;
  metafieldId?: string;
  productIds?: string[];
  products?: Product[];
}

interface FormState {
  title: string;
  method: DiscountMethod;
  code: string;
  combinesWith: CombinesWith;
  discountClasses: DiscountClass[];
  usageLimit: string;
  appliesOncePerCustomer: boolean;
  startDate: Date | string;
  endDate: Date | string | null;
  configuration: DiscountConfiguration;
}

interface UseDiscountFormProps {
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
      quantity: string;
      cartLinePercentage: string;
      orderPercentage: string;
      deliveryPercentage: string;
      metafieldId?: string;
      productIds?: string[];
    };
  };
  onSubmit?: () => void;
}

export function useDiscountForm({ initialData }: UseDiscountFormProps = {}) {
  const submit = useSubmit();
  const todaysDate = new Date();

  const [formState, setFormState] = useState<FormState>(() => ({
    title: initialData?.title ?? "",
    method: initialData?.method ?? DiscountMethod.Code,
    code: initialData?.code ?? "",
    discountClasses: initialData?.discountClasses ?? [DiscountClass.Product],
    combinesWith: initialData?.combinesWith ?? {
      orderDiscounts: false,
      productDiscounts: false,
      shippingDiscounts: false,
    },
    usageLimit: initialData?.usageLimit?.toString() ?? "",
    appliesOncePerCustomer: initialData?.appliesOncePerCustomer ?? false,
    startDate: initialData?.startsAt ?? todaysDate,
    endDate: initialData?.endsAt ?? null,
    configuration: {
      quantity: initialData?.configuration.quantity ?? "1",
      cartLinePercentage:
        initialData?.configuration.cartLinePercentage?.toString() ?? "0",
      orderPercentage:
        initialData?.configuration.orderPercentage?.toString() ?? "0",
      deliveryPercentage:
        initialData?.configuration.deliveryPercentage?.toString() ?? "0",
      metafieldId: initialData?.configuration.metafieldId,
      productIds: initialData?.configuration.productIds ?? [],
    },
  }));

  const setField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const setConfigField = useCallback(
    (
      field: keyof DiscountConfiguration,
      value: string | string[] | Product[],
    ) => {
      setFormState((prev) => ({
        ...prev,
        configuration: { ...prev.configuration, [field]: value },
      }));
    },
    [],
  );

  const setCombinesWith = useCallback(
    (field: keyof CombinesWith, value: boolean) => {
      setFormState((prev) => ({
        ...prev,
        combinesWith: { ...prev.combinesWith, [field]: value },
      }));
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    const formData = new FormData();
    formData.append(
      "discount",
      JSON.stringify({
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
          quantity: parseInt(formState.configuration.quantity, 10),
          cartLinePercentage: parseFloat(
            formState.configuration.cartLinePercentage,
          ),
          orderPercentage: parseFloat(formState.configuration.orderPercentage),
          deliveryPercentage: parseFloat(
            formState.configuration.deliveryPercentage,
          ),
          productIds: formState.configuration.productIds,
        },
      }),
    );
    submit(formData, { method: "post" });
  }, [formState, submit]);

  return {
    formState,
    setField,
    setConfigField,
    setCombinesWith,
    submit: handleSubmit,
  };
}
