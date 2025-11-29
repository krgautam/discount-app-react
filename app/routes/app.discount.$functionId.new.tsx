import {
  type ActionFunctionArgs,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";

import { DiscountForm } from "../components/DiscountForm/DiscountForm";
import {
  createCodeDiscount,
  createAutomaticDiscount,
} from "../models/discounts.server";
import { DiscountClass } from "../types/admin.types.d";
import { DiscountMethod } from "../types/types";
import { returnToDiscounts } from "../utils/navigation";

export const loader = async () => {
  // Initially load with empty collections since none are selected yet
  return { collections: [] };
};

// [START build-the-ui.add-action]
export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { functionId } = params;
  const formData = await request.formData();
  const discountData = formData.get("discount");
  if (!discountData || typeof discountData !== "string")
    throw new Error("No discount data provided");

  const {
    title,
    method,
    code,
    combinesWith,
    usageLimit,
    appliesOncePerCustomer,
    startsAt,
    endsAt,
    discountClasses,
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

  let result;

  if (method === DiscountMethod.Code) {
    result = await createCodeDiscount(
      request,
      baseDiscount,
      code,
      usageLimit,
      appliesOncePerCustomer,
      {
        cartLinePercentage: parseFloat(configuration.cartLinePercentage),
        orderPercentage: parseFloat(configuration.orderPercentage),
        deliveryPercentage: parseFloat(configuration.deliveryPercentage),
        productIds: configuration.productIds || [],
        quantity: parseInt(configuration.quantity || "1", 10),
      },
    );
  } else {
    result = await createAutomaticDiscount(request, baseDiscount, {
      cartLinePercentage: parseFloat(configuration.cartLinePercentage),
      orderPercentage: parseFloat(configuration.orderPercentage),
      deliveryPercentage: parseFloat(configuration.deliveryPercentage),
      productIds: configuration.productIds || [],
      quantity: parseInt(configuration.quantity || "1", 10),
    });
  }

  if (result.errors?.length > 0) {
    return { errors: result.errors };
  }
  return { success: true };
};
// [END build-the-ui.add-action]

interface ActionData {
  errors?: {
    code?: string;
    message: string;
    field: string[];
  }[];
  success?: boolean;
}

interface LoaderData {
  collections: { id: string; title: string }[];
}

export default function VolumeNew() {
  const actionData = useActionData<ActionData>();
  const { collections } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";
  const submitErrors = actionData?.errors || [];

  if (actionData?.success) {
    returnToDiscounts();
  }

  const initialData = {
    title: "",
    method: DiscountMethod.Automatic,
    code: "",
    quantity: "2",
    discountClasses: [DiscountClass.Product],
    combinesWith: {
      orderDiscounts: false,
      productDiscounts: false,
      shippingDiscounts: false,
    },
    usageLimit: null,
    appliesOncePerCustomer: false,
    startsAt: new Date(),
    endsAt: null,
    configuration: {
      cartLinePercentage: "0",
      quantity: "2",
      orderPercentage: "0",
      deliveryPercentage: "0",
      productIds: [],
    },
  };

  return (
    <s-page>
      <ui-title-bar title="Buy 2 get x% discount">
        <button type="button" variant="breadcrumb" onClick={returnToDiscounts}>
          Discounts
        </button>
      </ui-title-bar>

      <DiscountForm
        initialData={initialData}
        collections={collections}
        isLoading={isLoading}
        submitErrors={submitErrors}
        success={actionData?.success}
      />
    </s-page>
  );
}
