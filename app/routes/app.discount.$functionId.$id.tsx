import { Collection, DiscountClass } from "app/types/admin.types.d";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";

import { DiscountForm } from "../components/DiscountForm/DiscountForm";
import { NotFoundPage } from "../components/NotFoundPage";
import {
  getDiscount,
  updateAutomaticDiscount,
  updateCodeDiscount,
} from "../models/discounts.server";
import { DiscountMethod } from "../types/types";
import { returnToDiscounts } from "../utils/navigation";

interface ActionData {
  errors?: {
    code?: string;
    message: string;
    field?: string[];
  }[];
  success?: boolean;
}

interface LoaderData {
  discount: {
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
    startsAt: string;
    endsAt: string | null;
    configuration: {
      cartLinePercentage: number;
      orderPercentage: number;
      deliveryPercentage: number;
      metafieldId: string;
      productIds: string[];
      quantity?: number;
    };
  } | null;
  products: Collection[];
}

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { id, functionId } = params;
  if (!id) throw new Error("No discount ID provided");

  const formData = await request.formData();
  const discountData = formData.get("discount");
  if (!discountData || typeof discountData !== "string") {
    throw new Error("No discount data provided");
  }

  const {
    title,
    method,
    code,
    combinesWith,
    discountClasses,
    usageLimit,
    appliesOncePerCustomer,
    startsAt,
    endsAt,
    configuration,
  } = JSON.parse(discountData);

  const baseDiscount = {
    functionId,
    title,
    combinesWith,
    discountClasses,
    startsAt: new Date(startsAt),
    endsAt: endsAt && new Date(endsAt),
  };

  // Parse configuration values
  const parsedConfiguration = {
    metafieldId: configuration.metafieldId,
    cartLinePercentage: parseFloat(configuration.cartLinePercentage),
    orderPercentage: parseFloat(configuration.orderPercentage),
    deliveryPercentage: parseFloat(configuration.deliveryPercentage),
    productIds: configuration.productIds || [],
    quantity: parseInt(configuration.quantity || "1", 10),
  };

  let result;

  if (method === DiscountMethod.Code) {
    result = await updateCodeDiscount(
      request,
      id,
      baseDiscount,
      code,
      usageLimit,
      appliesOncePerCustomer,
      parsedConfiguration,
    );
  } else {
    result = await updateAutomaticDiscount(
      request,
      id,
      baseDiscount,
      parsedConfiguration,
    );
  }
  if (result.errors?.length > 0) {
    return { errors: result.errors };
  }
  return { success: true };
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { id } = params;
  if (!id) throw new Error("No discount ID provided");

  const { discount } = await getDiscount(request, id);

  // Product IDs are stored in the configuration, no need to fetch products
  // as they will be loaded via the resource picker when editing
  const products: Collection[] = [];

  return { discount, products };
};

export default function VolumeEdit() {
  const actionData = useActionData<ActionData>();
  const { discount: rawDiscount, products } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";
  const submitErrors =
    actionData?.errors?.map((error) => ({
      ...error,
      field: error.field || [],
    })) || [];

  if (!rawDiscount) {
    return <NotFoundPage />;
  }

  // Transform the discount data to match expected types
  const initialData = {
    ...rawDiscount,
    method: rawDiscount.method,
    discountClasses: rawDiscount.discountClasses,
    combinesWith: {
      orderDiscounts: rawDiscount.combinesWith.orderDiscounts,
      productDiscounts: rawDiscount.combinesWith.productDiscounts,
      shippingDiscounts: rawDiscount.combinesWith.shippingDiscounts,
    },
    usageLimit: rawDiscount.usageLimit,
    appliesOncePerCustomer: rawDiscount.appliesOncePerCustomer,
    startsAt: rawDiscount.startsAt,
    endsAt: rawDiscount.endsAt,
    configuration: {
      ...rawDiscount.configuration,
      cartLinePercentage: String(rawDiscount.configuration.cartLinePercentage),
      orderPercentage: String(rawDiscount.configuration.orderPercentage),
      deliveryPercentage: String(rawDiscount.configuration.deliveryPercentage),
      metafieldId: rawDiscount.configuration.metafieldId,
      productIds: rawDiscount.configuration.productIds || [],
      quantity: String(rawDiscount.configuration.quantity || 1),
    },
  };

  return (
    <s-page>
      <ui-title-bar title={`Edit ${rawDiscount.title}`}>
        <button type="button" variant="breadcrumb" onClick={returnToDiscounts}>
          Discounts
        </button>
      </ui-title-bar>

      <DiscountForm
        initialData={initialData}
        collections={products}
        isEditing={true}
        isLoading={isLoading}
        submitErrors={submitErrors}
        success={actionData?.success}
      />
    </s-page>
  );
}
