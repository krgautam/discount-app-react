import {render} from 'preact';
import {useState, useEffect} from 'preact/hooks';

export default async () => {
  render(<Extension />, document.body);
}

function Extension() {
  const {extension: {target}, i18n} = shopify;
  const product = useProduct();
  
  return (
    <s-stack direction="block" gap="base">
      <s-text>
        <strong>Volume Discount Configuration</strong>
      </s-text>
      <s-text>
        Product ID: {product?.id || 'Loading...'}
      </s-text>
      {product?.title && (
        <s-text>
          Product: {product.title}
        </s-text>
      )}
      <s-text>
        This product can be included in volume discount rules. 
        Configure discounts in the Discounts section of the app.
      </s-text>
    </s-stack>
  );
}

function useProduct() {
  const {data, query} = shopify;
  const productId = data?.selected[0]?.id;
  const [product, setProduct] = useState(null);

  useEffect(() => {
    if (!productId) return;

    query(
      `#graphql
      query GetProduct($id: ID!) {
        product(id: $id) {
          id
          title
        }
      }
      `,
      {variables: {id: productId}}
    ).then((response) => {
      if (!response) return;
      const {data, errors} = response;
      if (errors) {
        console.error('Error fetching product:', errors);
        setProduct({ id: productId, title: null });
      } else if (data && typeof data === 'object' && 'product' in data) {
        const productData = data.product;
        if (productData) {
          setProduct(productData);
        }
      }
    }).catch((error) => {
      console.error('Error fetching product:', error);
      setProduct({ id: productId, title: null });
    });
  }, [productId, query]);

  return product;
}