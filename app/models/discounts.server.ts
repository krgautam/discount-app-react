import {
  CREATE_CODE_DISCOUNT,
  CREATE_AUTOMATIC_DISCOUNT,
  UPDATE_CODE_DISCOUNT,
  UPDATE_AUTOMATIC_DISCOUNT,
  GET_DISCOUNT,
  GET_ALL_DISCOUNTS,
  GET_SHOP,
  UPDATE_SHOP_METAFIELD,
} from "../graphql/discounts";
import { authenticate } from "../shopify.server";
import type { DiscountClass } from "../types/admin.types.d";
import { DiscountMethod } from "../types/types";

interface BaseDiscount {
  functionId?: string;
  title: string;
  discountClasses: DiscountClass[];
  combinesWith: {
    orderDiscounts: boolean;
    productDiscounts: boolean;
    shippingDiscounts: boolean;
  };
  startsAt: Date;
  endsAt: Date | null;
}

interface DiscountConfiguration {
  cartLinePercentage: number;
  orderPercentage: number;
  deliveryPercentage: number;
  productIds?: string[];
  quantity?: number;
}

interface UserError {
  code?: string;
  message: string;
  field?: string[];
}

export async function createCodeDiscount(
  request: Request,
  baseDiscount: BaseDiscount,
  code: string,
  usageLimit: number | null,
  appliesOncePerCustomer: boolean,
  configuration: DiscountConfiguration,
) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(CREATE_CODE_DISCOUNT, {
    variables: {
      discount: {
        ...baseDiscount,
        title: code,
        code,
        usageLimit,
        appliesOncePerCustomer,
        metafields: [
          {
            namespace: "volume_discount",
            key: "rules",
            type: "json",
            value: JSON.stringify({
              products: configuration.productIds || [],
              minQty: configuration.quantity || 1,
              percentOff: configuration.cartLinePercentage || 0,
            }),
          },
        ],
      },
    },
  });

  const responseJson = await response.json();

  // Sync discount rules to shop metafield for theme access
  if (!responseJson.data.discountCreate?.userErrors?.length) {
    await syncDiscountRulesToShop(request);
  }

  return {
    errors: responseJson.data.discountCreate?.userErrors as UserError[],
    discount: responseJson.data.discountCreate?.codeAppDiscount,
  };
}

export async function createAutomaticDiscount(
  request: Request,
  baseDiscount: BaseDiscount,
  configuration: DiscountConfiguration,
) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(CREATE_AUTOMATIC_DISCOUNT, {
    variables: {
      discount: {
        ...baseDiscount,
        metafields: [
          {
            namespace: "volume_discount",
            key: "rules",
            type: "json",
            value: JSON.stringify({
              products: configuration.productIds || [],
              minQty: configuration.quantity || 1,
              percentOff: configuration.cartLinePercentage || 0,
            }),
          },
        ],
      },
    },
  });

  const responseJson = await response.json();

  // Sync discount rules to shop metafield for theme access
  if (!responseJson.data.discountCreate?.userErrors?.length) {
    await syncDiscountRulesToShop(request);
  }

  return {
    errors: responseJson.data.discountCreate?.userErrors as UserError[],
  };
}

export async function updateCodeDiscount(
  request: Request,
  id: string,
  baseDiscount: BaseDiscount,
  code: string,
  usageLimit: number | null,
  appliesOncePerCustomer: boolean,
  configuration: {
    metafieldId: string;
    cartLinePercentage: number;
    orderPercentage: number;
    deliveryPercentage: number;
    productIds?: string[];
    quantity?: number;
  },
) {
  const { admin } = await authenticate.admin(request);
  const discountId = id.includes("gid://")
    ? id
    : `gid://shopify/DiscountCodeNode/${id}`;

  const response = await admin.graphql(UPDATE_CODE_DISCOUNT, {
    variables: {
      id: discountId,
      discount: {
        ...baseDiscount,
        title: code,
        code,
        usageLimit,
        appliesOncePerCustomer,
        metafields: [
          {
            id: configuration.metafieldId,
            value: JSON.stringify({
              products: configuration.productIds || [],
              minQty: configuration.quantity || 1,
              percentOff: configuration.cartLinePercentage || 0,
            }),
          },
        ],
      },
    },
  });

  const responseJson = await response.json();
  return {
    errors: responseJson.data.discountUpdate?.userErrors as UserError[],
  };
}

export async function updateAutomaticDiscount(
  request: Request,
  id: string,
  baseDiscount: BaseDiscount,
  configuration: {
    metafieldId: string;
    cartLinePercentage: number;
    orderPercentage: number;
    deliveryPercentage: number;
    productIds?: string[];
    quantity?: number;
  },
) {
  const { admin } = await authenticate.admin(request);
  const discountId = id.includes("gid://")
    ? id
    : `gid://shopify/DiscountAutomaticApp/${id}`;

  const response = await admin.graphql(UPDATE_AUTOMATIC_DISCOUNT, {
    variables: {
      id: discountId,
      discount: {
        ...baseDiscount,
        metafields: [
          {
            id: configuration.metafieldId,
            value: JSON.stringify({
              products: configuration.productIds || [],
              minQty: configuration.quantity || 1,
              percentOff: configuration.cartLinePercentage || 0,
            }),
          },
        ],
      },
    },
  });

  const responseJson = await response.json();
  
  // Sync discount rules to shop metafield for theme access
  if (!responseJson.data.discountUpdate?.userErrors?.length) {
    await syncDiscountRulesToShop(request);
  }
  
  return {
    errors: responseJson.data.discountUpdate?.userErrors as UserError[],
  };
}

export async function getDiscount(request: Request, id: string) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(GET_DISCOUNT, {
    variables: {
      id: `gid://shopify/DiscountNode/${id}`,
    },
  });

  const responseJson = await response.json();
  if (
    !responseJson.data.discountNode ||
    !responseJson.data.discountNode.discount
  ) {
    return { discount: null };
  }

  const method =
    responseJson.data.discountNode.discount.__typename === "DiscountCodeApp"
      ? DiscountMethod.Code
      : DiscountMethod.Automatic;

  const {
    title,
    codes,
    combinesWith,
    usageLimit,
    appliesOncePerCustomer,
    startsAt,
    endsAt,
    discountClasses,
  } = responseJson.data.discountNode.discount;
  const configuration = JSON.parse(
    responseJson.data.discountNode.configurationField.value,
  );

  return {
    discount: {
      title,
      method,
      code: codes?.nodes[0]?.code ?? "",
      combinesWith,
      discountClasses,
      usageLimit: usageLimit ?? null,
      appliesOncePerCustomer: appliesOncePerCustomer ?? false,
      startsAt,
      endsAt,
      configuration: {
        productIds: configuration.products || [],
        quantity: String(configuration.minQty || 1),
        cartLinePercentage: String(configuration.percentOff || 0),
        orderPercentage: "0",
        deliveryPercentage: "0",
        metafieldId: responseJson.data.discountNode.configurationField.id,
      },
    },
  };
}

/**
 * Syncs all active discount rules to the shop metafield
 * This allows the theme extension to access discount rules
 */
export async function syncDiscountRulesToShop(request: Request) {
  const { admin } = await authenticate.admin(request);
  
  try {
    console.log("Starting syncDiscountRulesToShop...");
    
    // Get shop ID and check existing metafield
    const shopResponse = await admin.graphql(GET_SHOP);
    const shopJson = await shopResponse.json();
    const shopId = shopJson.data?.shop?.id;
    const existingMetafield = shopJson.data?.shop?.metafield;
    
    if (!shopId) {
      const error = "Could not get shop ID";
      console.error(error);
      throw new Error(error);
    }
    
    console.log("Shop ID:", shopId);
    console.log("Existing metafield:", existingMetafield ? "Found" : "Not found");

    // Get all discounts
    const response = await admin.graphql(GET_ALL_DISCOUNTS);
    const responseJson = await response.json();
    
    console.log("Total discount nodes found:", responseJson.data?.discountNodes?.nodes?.length || 0);
    
    if (!responseJson.data?.discountNodes?.nodes) {
      console.log("No discount nodes found, syncing empty array");
    }

    const now = new Date().toISOString();
    const activeRules: Array<{
      products: string[];
      minQty: number;
      percentOff: number;
    }> = [];

    // Collect active discount rules
    for (const node of responseJson.data.discountNodes.nodes || []) {
      if (!node.configurationField?.value) {
        console.log("Skipping node without configurationField");
        continue;
      }

      const discount = node.discount;
      if (!discount) {
        console.log("Skipping node without discount");
        continue;
      }

      // Check if discount is active
      const startsAt = discount.startsAt ? new Date(discount.startsAt) : null;
      const endsAt = discount.endsAt ? new Date(discount.endsAt) : null;
      const nowDate = new Date(now);

      if (startsAt && nowDate < startsAt) {
        console.log("Skipping discount that hasn't started yet");
        continue;
      }
      if (endsAt && nowDate > endsAt) {
        console.log("Skipping expired discount");
        continue;
      }

      try {
        const config = JSON.parse(node.configurationField.value);
        if (config.products && config.products.length > 0) {
          console.log(`Adding rule with ${config.products.length} products, minQty: ${config.minQty}, percentOff: ${config.percentOff}`);
          activeRules.push({
            products: config.products || [],
            minQty: config.minQty || 1,
            percentOff: config.percentOff || 0,
          });
        } else {
          console.log("Skipping rule with no products");
        }
      } catch (e) {
        console.error("Error parsing discount configuration:", e);
      }
    }

    console.log(`Collected ${activeRules.length} active rule(s)`);

    // Prepare metafield input
    const metafieldInput: any = {
      ownerId: shopId,
      namespace: "volume_discount",
      key: "rules",
      type: "json",
      value: JSON.stringify(activeRules),
    };
    
    // If metafield exists, include its ID for update
    if (existingMetafield?.id) {
      metafieldInput.id = existingMetafield.id;
      console.log("Updating existing metafield:", existingMetafield.id);
    } else {
      console.log("Creating new metafield");
    }
    
    console.log("Metafield input:", JSON.stringify(metafieldInput, null, 2));
    
    // Update shop metafield with aggregated rules (even if empty array)
    const updateResponse = await admin.graphql(UPDATE_SHOP_METAFIELD, {
      variables: {
        metafields: [metafieldInput],
      },
    });
    
    const updateJson = await updateResponse.json();
    console.log("Update response:", JSON.stringify(updateJson, null, 2));
    
    if (updateJson.data?.metafieldsSet?.userErrors?.length > 0) {
      const errorMsg = `Failed to update shop metafield: ${JSON.stringify(updateJson.data.metafieldsSet.userErrors)}`;
      console.error("❌", errorMsg);
      throw new Error(errorMsg);
    } else if (updateJson.data?.metafieldsSet?.metafields?.length > 0) {
      console.log(`✅ Successfully synced ${activeRules.length} discount rule(s) to shop metafield`);
      console.log("Created/Updated metafield:", updateJson.data.metafieldsSet.metafields[0]);
      if (activeRules.length > 0) {
        console.log("Active rules:", JSON.stringify(activeRules, null, 2));
      }
    } else {
      console.warn("⚠️ No metafields returned from mutation, but no errors either");
    }
    
    return { success: true, rulesCount: activeRules.length, rules: activeRules };
  } catch (error) {
    console.error("❌ Error syncing discount rules to shop:", error);
    throw error;
  }
}
