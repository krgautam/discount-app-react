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
  const { products, minQty, percentOff } = parseMetafield(
    input.discount.metafield
  );
  if (!products || products.length === 0 || percentOff === 0) {
    return { operations: [] };
  }
  const minimumQuantity = minQty || 1;
  const qualifyingLines = input.cart.lines.filter((line) => {
    if (line.quantity < minimumQuantity) {
      return false;
    }
    if (line.merchandise.__typename !== "ProductVariant") {
      return false;
    }
    const productId = line.merchandise.product?.id;
    if (!productId) {
      return false;
    }
    return products.includes(productId);
  });
  if (qualifyingLines.length === 0) {
    return { operations: [] };
  }
  const candidates = qualifyingLines.map((line) => ({
    message: `${percentOff}% OFF`,
    targets: [
      {
        cartLine: {
          id: line.id
        }
      }
    ],
    value: {
      percentage: {
        value: percentOff
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
    if (!metafield || !metafield.value) {
      return {
        products: [],
        minQty: 1,
        percentOff: 0
      };
    }
    const value = JSON.parse(metafield.value);
    return {
      products: value.products || [],
      minQty: value.minQty || 1,
      percentOff: value.percentOff || 0
    };
  } catch (error) {
    console.error("Error parsing metafield", error);
    return {
      products: [],
      minQty: 1,
      percentOff: 0
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
