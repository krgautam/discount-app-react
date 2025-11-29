import { type ActionFunctionArgs, type LoaderFunctionArgs, useLoaderData, useActionData, useSubmit } from "react-router";

import { getFunctions } from "../models/functions.server";
import { syncDiscountRulesToShop } from "../models/discounts.server";
import { returnToDiscounts } from "../utils/navigation";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const functions = await getFunctions(request);
  return { functions };
};

export async function action({ request }: ActionFunctionArgs) {
  if (request.method === "POST") {
    const formData = await request.formData();
    if (formData.get("action") === "sync") {
      try {
        const result = await syncDiscountRulesToShop(request);
        return { 
          syncSuccess: true, 
          syncMessage: `Synced ${result?.rulesCount || 0} discount rule(s) to shop metafield`,
          rulesCount: result?.rulesCount || 0
        };
      } catch (error) {
        return { 
          syncSuccess: false, 
          syncMessage: error instanceof Error ? error.message : "Failed to sync discount rules"
        };
      }
    }
  }
  return {};
}

export default function Index() {
  const { functions } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

  const handleSync = () => {
    const formData = new FormData();
    formData.append("action", "sync");
    submit(formData, { method: "post" });
  };

  return (
    <s-page>
      <ui-title-bar title="Discount Functions">
        <button onClick={returnToDiscounts}>View all discounts</button>
      </ui-title-bar>

      {actionData?.syncMessage && (
        <s-banner
          status={actionData.syncSuccess ? "success" : "critical"}
          title={actionData.syncSuccess ? "Sync Successful" : "Sync Failed"}
        >
          {actionData.syncMessage}
        </s-banner>
      )}

      <s-section>
        <s-box padding="base" borderRadius="base">
          <s-grid gap="base" alignItems="center" gridTemplateColumns="1fr auto">
            <div>
              <s-heading>Sync Discount Rules</s-heading>
              <s-text tone="subdued">
                Sync all active discount rules to shop metafield for theme access
              </s-text>
            </div>
            <s-button onClick={handleSync} variant="primary">
              Sync Now
            </s-button>
          </s-grid>
        </s-box>
      </s-section>

      {functions.length === 0 ? (
        <s-section accessibilityLabel="Empty state section">
          <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
            <s-grid
              justifyItems="center"
              maxBlockSize="450px"
              maxInlineSize="450px"
            >
              <s-heading>Start creating discount functions</s-heading>
              <s-paragraph>
                No functions found. Deploy your app to see available discount
                functions.
              </s-paragraph>
            </s-grid>
          </s-grid>
        </s-section>
      ) : (
        <>
          <s-section>
            <s-grid gap="base">
              <s-heading>Available Functions</s-heading>
              <s-paragraph>
                Create and manage custom discount functions for your store. Use
                these functions to implement complex discount logic and pricing
                rules.
              </s-paragraph>
            </s-grid>
          </s-section>

          <s-section>
            <s-grid gap="small-200">
              {functions.map((item) => (
                <s-box key={item.id} padding="base" borderRadius="base">
                  <s-grid
                    gridTemplateColumns="1fr auto"
                    alignItems="center"
                    gap="base"
                  >
                    <s-text>{item.title}</s-text>
                    <s-button href={`/app/discount/${item.id}/new`}>
                      Create discount
                    </s-button>
                  </s-grid>
                </s-box>
              ))}
            </s-grid>
          </s-section>
        </>
      )}
    </s-page>
  );
}
