import { useOrg } from "@/components/layout/org/organizationContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getJawnClient } from "@/lib/clients/jawn";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useCostForPrompts } from "./hooks";
import { ContactCTA } from "./contactCTA";

export const UpgradeToProCTA = ({
  defaultPrompts = false,
  defaultAlerts = false,
  showAddons = false,
  showContactCTA = false,
}) => {
  const org = useOrg();
  const subscription = useQuery({
    queryKey: ["subscription", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);
      const subscription = await jawn.GET("/v1/stripe/subscription");
      return subscription;
    },
  });
  const [prompts, setPrompts] = useState(defaultPrompts);
  const [alerts, setAlerts] = useState(defaultAlerts);

  const upgradeToPro = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const endpoint =
        subscription.data?.data?.status === "canceled"
          ? "/v1/stripe/subscription/existing-customer/upgrade-to-pro"
          : "/v1/stripe/subscription/new-customer/upgrade-to-pro";
      const result = await jawn.POST(endpoint, {
        body: {
          addons: {
            prompts,
            alerts,
          },
        },
      });
      return result;
    },
  });

  const isPro = useMemo(() => {
    return (
      org?.currentOrg?.tier === "pro-20240913" ||
      org?.currentOrg?.tier === "pro-20250202" ||
      org?.currentOrg?.tier === "team-20250130"
    );
  }, [org?.currentOrg?.tier]);

  const costForPrompts = useCostForPrompts();

  return (
    <div>
      {showAddons && (
        <div className="mt-4 rounded-lg border p-4">
          <h3 className="mb-2 font-semibold">Add-ons</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Switch
                id="unlimited-prompts"
                checked={prompts}
                onCheckedChange={(checked) => setPrompts(checked)}
              />
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="unlimited-prompts"
                  className="whitespace-nowrap"
                >
                  Prompts & Experiments
                </Label>
                <p className="whitespace-nowrap text-sm text-muted-foreground text-slate-500">
                  + ${costForPrompts.data?.data ?? "loading..."}/mo
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Switch
                id="unlimited-alerts"
                checked={alerts}
                onCheckedChange={(checked) => setAlerts(checked)}
              />
              <div className="flex items-center space-x-2">
                <Label htmlFor="unlimited-alerts" className="whitespace-nowrap">
                  Unlimited Alerts
                </Label>
                <p className="whitespace-nowrap text-sm text-muted-foreground text-slate-500">
                  + $15/mo
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {showContactCTA && <ContactCTA />}
      <Button
        onClick={async () => {
          if (isPro) {
            window.open("/settings/billing", "_blank");
          } else {
            const result = await upgradeToPro.mutateAsync();
            if (result.data) {
              window.open(result.data, "_blank");
            } else {
              console.error("No URL returned from upgrade mutation");
            }
          }
        }}
        className="mt-4 w-full"
        disabled={upgradeToPro.isPending}
      >
        {upgradeToPro.isPending
          ? "Loading..."
          : isPro
            ? "Upgrade"
            : "Start 7-day free trial"}
      </Button>
    </div>
  );
};
