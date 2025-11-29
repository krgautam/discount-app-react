// node_modules/@shopify/shopify_function/run.ts
function run_default(userfunction) {
  try {
    ShopifyFunction;
  } catch (e) {
    throw new Error(
      "ShopifyFunction is not defined. Please rebuild your function using the latest version of Shopify CLI."
    );
  }
  const input_obj = ShopifyFunction.readInput();
  const output_obj = userfunction(input_obj);
  ShopifyFunction.writeOutput(output_obj);
}

// extensions/discount-function-js/src/cart_lines_discounts_generate_run.js
function cartLinesDiscountsGenerateRun(input) {
  if (!input.cart.lines.length) {
    return { operations: [] };
  }
  const hasProductDiscountClass = input.discount.discountClasses.includes(
    "PRODUCT" /* Product */
  );
  if (!hasProductDiscountClass) {
    return { operations: [] };
  }
  const { cartLinePercentage, collectionIds, quantity } = parseMetafield(
    input.discount.metafield
  );
  if (cartLinePercentage === 0) {
    return { operations: [] };
  }
  const minimumQuantity = quantity || 1;
  const qualifyingLines = input.cart.lines.filter((line) => {
    if (line.quantity < minimumQuantity) {
      return false;
    }
    if (line.merchandise.__typename !== "ProductVariant") {
      return false;
    }
    return true;
  });
  if (qualifyingLines.length === 0) {
    return { operations: [] };
  }
  const candidates = qualifyingLines.map((line) => ({
    message: `${cartLinePercentage}% OFF`,
    targets: [
      {
        cartLine: {
          id: line.id
        }
      }
    ],
    value: {
      percentage: {
        value: cartLinePercentage
      }
    }
  }));
  return {
    operations: [
      {
        productDiscountsAdd: {
          candidates,
          selectionStrategy: "ALL" /* All */
        }
      }
    ]
  };
}
function parseMetafield(metafield) {
  try {
    const value = JSON.parse(metafield.value);
    return {
      cartLinePercentage: value.cartLinePercentage || 0,
      orderPercentage: value.orderPercentage || 0,
      deliveryPercentage: value.deliveryPercentage || 0,
      collectionIds: value.collectionIds || [],
      quantity: value.quantity || 2
    };
  } catch (error) {
    console.error("Error parsing metafield", error);
    return {
      cartLinePercentage: 0,
      orderPercentage: 0,
      deliveryPercentage: 0,
      collectionIds: [],
      quantity: 1
    };
  }
}

// extensions/discount-function-js/src/cart_delivery_options_discounts_generate_run.js
function cartDeliveryOptionsDiscountsGenerateRun(input) {
  const firstDeliveryGroup = input.cart.deliveryGroups[0];
  if (!firstDeliveryGroup) {
    throw new Error("No delivery groups found");
  }
  const hasShippingDiscountClass = input.discount.discountClasses.includes(
    "SHIPPING" /* Shipping */
  );
  if (!hasShippingDiscountClass) {
    return { operations: [] };
  }
  return {
    operations: [
      {
        deliveryDiscountsAdd: {
          candidates: [
            {
              message: "FREE DELIVERY",
              targets: [
                {
                  deliveryGroup: {
                    id: firstDeliveryGroup.id
                  }
                }
              ],
              value: {
                percentage: {
                  value: 100
                }
              }
            }
          ],
          selectionStrategy: "ALL" /* All */
        }
      }
    ]
  };
}

// <stdin>
function cartLinesDiscountsGenerateRun2() {
  return run_default(cartLinesDiscountsGenerateRun);
}
function cartDeliveryOptionsDiscountsGenerateRun2() {
  return run_default(cartDeliveryOptionsDiscountsGenerateRun);
}
export {
  cartDeliveryOptionsDiscountsGenerateRun2 as cartDeliveryOptionsDiscountsGenerateRun,
  cartLinesDiscountsGenerateRun2 as cartLinesDiscountsGenerateRun
};
