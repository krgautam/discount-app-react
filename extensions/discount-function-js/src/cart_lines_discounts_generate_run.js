import {
  DiscountClass,
  ProductDiscountSelectionStrategy,
} from '../generated/api';

/**
 * @typedef {import("../generated/api").CartInput} RunInput
 * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
 */

/**
 * @param {RunInput} input
 * @returns {CartLinesDiscountsGenerateRunResult}
 */
export function cartLinesDiscountsGenerateRun(input) {
  if (!input.cart.lines.length) {
    return {operations: []};
  }

  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );

  if (!hasProductDiscountClass) {
    return {operations: []};
  }

  const { products, minQty, percentOff } = parseMetafield(
    input.discount.metafield,
  );

  if (!products || products.length === 0 || percentOff === 0) {
    return {operations: []};
  }

  const minimumQuantity = minQty || 1;

  // Filter cart lines that match the configured products and meet minimum quantity
  const qualifyingLines = input.cart.lines.filter((line) => {
    // Check minimum quantity requirement
    if (line.quantity < minimumQuantity) {
      return false;
    }

    // Must be a product variant
    if (line.merchandise.__typename !== 'ProductVariant') {
      return false;
    }

    // Check if the product ID matches any of the configured products
    const productId = line.merchandise.product?.id;
    if (!productId) {
      return false;
    }

    // Check if product is in the configured products list
    return products.includes(productId);
  });

  if (qualifyingLines.length === 0) {
    return {operations: []};
  }

  // Create discount candidates for qualifying lines
  const candidates = qualifyingLines.map((line) => ({
    message: `${percentOff}% OFF`,
    targets: [
      {
        cartLine: {
          id: line.id,
        },
      },
    ],
    value: {
      percentage: {
        value: percentOff,
      },
    },
  }));

  return {
    operations: [
      {
        productDiscountsAdd: {
          candidates,
          selectionStrategy: ProductDiscountSelectionStrategy.All,
        },
      },
    ],
  };
}

function parseMetafield(metafield) {
  try {
    if (!metafield || !metafield.value) {
      return {
        products: [],
        minQty: 1,
        percentOff: 0,
      };
    }

    const value = JSON.parse(metafield.value);
    return {
      products: value.products || [],
      minQty: value.minQty || 1,
      percentOff: value.percentOff || 0,
    };
  } catch (error) {
    console.error('Error parsing metafield', error);
    return {
      products: [],
      minQty: 1,
      percentOff: 0,
    };
  }
}
