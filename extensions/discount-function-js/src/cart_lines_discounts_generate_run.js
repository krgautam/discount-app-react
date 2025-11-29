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

  const { cartLinePercentage, collectionIds, quantity } = parseMetafield(
    input.discount.metafield,
  );

  if (cartLinePercentage === 0) {
    return {operations: []};
  }

  const minimumQuantity = quantity || 1;

  const qualifyingLines = input.cart.lines.filter((line) => {
    if (line.quantity < minimumQuantity) {
      return false;
    }

    if (line.merchandise.__typename !== 'ProductVariant') {
      return false;
    }

    // Note: Collection filtering would require GraphQL variables which aren't supported
    // For now, we apply the discount to all products meeting the quantity requirement
    // Collection filtering can be added later if needed through a different mechanism

    return true;
  });

  if (qualifyingLines.length === 0) {
    return {operations: []};
  }

  const candidates = qualifyingLines.map((line) => ({
    message: `${cartLinePercentage}% OFF`,
    targets: [
      {
        cartLine: {
          id: line.id,
        },
      },
    ],
    value: {
      percentage: {
        value: cartLinePercentage,
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
    const value = JSON.parse(metafield.value);
    return {
      cartLinePercentage: value.cartLinePercentage || 0,
      orderPercentage: value.orderPercentage || 0,
      deliveryPercentage: value.deliveryPercentage || 0,
      collectionIds: value.collectionIds || [],
      quantity: value.quantity || 2,
    };
  } catch (error) {
    console.error('Error parsing metafield', error);
    return {
      cartLinePercentage: 0,
      orderPercentage: 0,
      deliveryPercentage: 0,
      collectionIds: [],
      quantity: 1,
    };
  }
}
