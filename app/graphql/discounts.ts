// Queries
export const GET_DISCOUNT = `
  query GetDiscount($id: ID!) {
    discountNode(id: $id) {
      id
      configurationField: metafield(
        namespace: "volume_discount"
        key: "rules"
      ) {
        id
        value
      }
      discount {
        __typename
        ... on DiscountAutomaticApp {
          title
          discountClasses
          combinesWith {
            orderDiscounts
            productDiscounts
            shippingDiscounts
          }
          startsAt
          endsAt
        }
        ... on DiscountCodeApp {
          title
          discountClasses
          combinesWith {
            orderDiscounts
            productDiscounts
            shippingDiscounts
          }
          startsAt
          endsAt
          usageLimit
          appliesOncePerCustomer
          codes(first: 1) {
            nodes {
              code
            }
          }
        }
      }
    }
  }
`;

// Mutations
export const UPDATE_CODE_DISCOUNT = `
  mutation UpdateCodeDiscount($id: ID!, $discount: DiscountCodeAppInput!) {
    discountUpdate: discountCodeAppUpdate(id: $id, codeAppDiscount: $discount) {
      userErrors {
        code
        message
        field
      }
    }
  }
`;

export const UPDATE_AUTOMATIC_DISCOUNT = `
  mutation UpdateAutomaticDiscount(
    $id: ID!
    $discount: DiscountAutomaticAppInput!
  ) {
    discountUpdate: discountAutomaticAppUpdate(
      id: $id
      automaticAppDiscount: $discount
    ) {
      userErrors {
        code
        message
        field
      }
    }
  }
`;

export const CREATE_CODE_DISCOUNT = `
  mutation CreateCodeDiscount($discount: DiscountCodeAppInput!) {
    discountCreate: discountCodeAppCreate(codeAppDiscount: $discount) {
      codeAppDiscount {
        discountId
      }
      userErrors {
        code
        message
        field
      }
    }
  }
`;

export const CREATE_AUTOMATIC_DISCOUNT = `
  mutation CreateAutomaticDiscount($discount: DiscountAutomaticAppInput!) {
    discountCreate: discountAutomaticAppCreate(
      automaticAppDiscount: $discount
    ) {
      automaticAppDiscount {
        discountId
      }
      userErrors {
        code
        message
        field
      }
    }
  }
`;

export const GET_ALL_DISCOUNTS = `
  query GetAllDiscounts {
    discountNodes(first: 250) {
      nodes {
        id
        discount {
          __typename
          ... on DiscountAutomaticApp {
            startsAt
            endsAt
          }
          ... on DiscountCodeApp {
            startsAt
            endsAt
          }
        }
        configurationField: metafield(
          namespace: "volume_discount"
          key: "rules"
        ) {
          value
        }
      }
    }
  }
`;

export const GET_SHOP = `
  query GetShop {
    shop {
      id
      metafield(namespace: "volume_discount", key: "rules") {
        id
        value
      }
    }
  }
`;

export const UPDATE_SHOP_METAFIELD = `
  mutation UpdateShopMetafield($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        namespace
        key
      }
      userErrors {
        field
        message
      }
    }
  }
`;
