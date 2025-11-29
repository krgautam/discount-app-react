import { type ActionFunctionArgs, type LoaderFunctionArgs, useLoaderData, useActionData } from "react-router";
import { syncDiscountRulesToShop } from "../models/discounts.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return { message: "Click the button below to sync discount rules" };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const result = await syncDiscountRulesToShop(request);
    return { 
      success: true, 
      message: `Discount rules synced successfully! Found ${result?.rulesCount || 0} active rule(s).`,
      rulesCount: result?.rulesCount || 0
    };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Unknown error",
      error: String(error)
    };
  }
};

export default function SyncDiscounts() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  
  return (
    <div style={{ padding: "20px", fontFamily: "system-ui", maxWidth: "800px" }}>
      <h1>Sync Discount Rules to Shop Metafield</h1>
      <p>This page will sync all active discount rules to the shop metafield so the theme extension can access them.</p>
      <p style={{ color: "#666" }}>Check your server console/logs for detailed information.</p>
      
      {actionData && (
        <div style={{ 
          padding: "15px", 
          margin: "20px 0", 
          borderRadius: "5px",
          backgroundColor: actionData.success ? "#d4edda" : "#f8d7da",
          border: `1px solid ${actionData.success ? "#c3e6cb" : "#f5c6cb"}`,
          color: actionData.success ? "#155724" : "#721c24"
        }}>
          <strong>{actionData.success ? "✅ Success:" : "❌ Error:"}</strong> {actionData.message}
          {actionData.rulesCount !== undefined && (
            <div style={{ marginTop: "10px" }}>
              Rules synced: {actionData.rulesCount}
            </div>
          )}
        </div>
      )}
      
      <form method="post">
        <button 
          type="submit" 
          style={{ 
            padding: "12px 24px", 
            fontSize: "16px",
            backgroundColor: "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Sync Now
        </button>
      </form>
      
      <div style={{ marginTop: "30px", padding: "15px", backgroundColor: "#f0f0f0", borderRadius: "5px" }}>
        <h3>Next Steps:</h3>
        <ol>
          <li>Click "Sync Now" above</li>
          <li>Check server logs for confirmation</li>
          <li>Go to your product page and view page source</li>
          <li>Look for HTML comments starting with "DEBUG:" to see what's happening</li>
          <li>Verify the metafield exists in Shopify Admin → Settings → Custom data → Shop</li>
        </ol>
      </div>
    </div>
  );
}

