import {
  useGetOrg,
  useGetOrgMembers,
} from "../../../../../services/hooks/organizations";
import { OrgLimits } from "../../../organization/createOrgForm";
import { getUSDateFromString } from "../../../../shared/utils/utils";
import { clsx } from "../../../../shared/clsx";
import OrgMembersPage from "../../../organization/members/orgMembersPage";
import { AreaChart } from "@tremor/react";
import { useState } from "react";
import LoadingAnimation from "../../../../shared/loadingAnimation";
import ProviderKeyList from "./providerKeyList";
import { useOrg } from "../../../../layout/org/organizationContext";
import { useRouter } from "next/router";
import { DeleteOrgModal } from "../../../organization/deleteOrgModal";
import EditCustomerOrgModal from "../editCustomerOrgModal";
import HcBreadcrumb from "../../../../ui/hcBreadcrumb";
import { formatISO } from "date-fns";
import { useRequestsOverTime } from "../../../organization/plan/renderOrgPlan";
import StyledAreaChart from "../../../dashboard/styledAreaChart";
import {
  ORGANIZATION_COLORS,
  ORGANIZATION_ICONS,
} from "@/components/templates/organization/orgConstants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PortalIdPageProps {
  orgId: string | null;
}

const PortalIdPage = (props: PortalIdPageProps) => {
  const { orgId } = props;

  const { data: orgData, isLoading, refetch } = useGetOrg(orgId || "");
  const org = orgData?.data;
  const {
    data: members,
    isLoading: isMembersLoading,
    refetch: isRefetching,
  } = useGetOrgMembers(orgId || "");
  const orgContext = useOrg();
  const router = useRouter();
  const startOfMonthFormatted = formatISO(
    new Date(new Date().setDate(new Date().getDate() - 28)),
    {
      representation: "date",
    },
  );

  const tomorrow = new Date(
    formatISO(new Date(), {
      representation: "date",
    }),
  );
  tomorrow.setDate(tomorrow.getDate() + 2);

  const timeFilter: {
    start: Date;
    end: Date;
  } = {
    start: new Date(startOfMonthFormatted),
    end: tomorrow,
  };

  const {
    data,
    isLoading: isRequestsLoading,
    refetch: refetchRequests,
  } = useRequestsOverTime({
    timeFilter,
    organizationId: orgId || undefined,
  });

  const chartData = data?.data?.map((d: any) => {
    if (new Date(d.time) > new Date()) {
      return {
        requests: null,
        date: new Date(d.time).toLocaleDateString(),
      };
    } else {
      return {
        requests: +d.count,
        date: new Date(d.time).toLocaleDateString(),
      };
    }
  });

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const currentIcon = ORGANIZATION_ICONS.find(
    (icon) => icon.name === org?.icon,
  );

  const currentColor = ORGANIZATION_COLORS.find(
    (icon) => icon.name === org?.color,
  );

  const orgLimits = org?.limits as OrgLimits;
  const owner = members?.find((member) => member.org_role === "owner");

  return (
    <div className="flex flex-col space-y-4">
      <HcBreadcrumb
        pages={[
          {
            href: "/enterprise/portal",
            name: "Customer Portal",
          },
          {
            href: `/enterprise/portal/${orgId}`,
            name: org?.name || "n/a",
          },
        ]}
      />
      <div className="flex w-full flex-row space-x-8 py-2">
        {isLoading ? (
          <LoadingAnimation />
        ) : (
          <>
            <div className="flex w-full max-w-[20rem] flex-col items-start space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex h-8 w-8 flex-none flex-col items-center justify-center rounded-md border border-gray-300 bg-gray-100 object-cover dark:border-gray-700 dark:bg-gray-900">
                  {currentIcon && (
                    <currentIcon.icon
                      className={clsx(
                        `text-${currentColor?.name}-500`,
                        "h-6 w-6",
                      )}
                    />
                  )}
                </div>
                <h1 className="text-2xl font-semibold text-black dark:text-white">
                  {org?.name}
                </h1>
              </div>
              <div className="flex w-full flex-row items-center space-x-2 pt-4">
                <button
                  onClick={() => {
                    // set the org id and then redirect the user to the dashboard page
                    if (org) {
                      orgContext?.setCurrentOrg(org.id);
                      router.push("/dashboard");
                    }
                  }}
                  className="flex w-full items-center justify-center rounded-lg border border-gray-500 bg-white px-4 py-2 text-xs font-semibold text-black dark:bg-black dark:text-white"
                >
                  View
                </button>{" "}
                <button
                  onClick={() => {
                    setEditOpen(true);
                  }}
                  className="flex w-full items-center justify-center rounded-lg border border-gray-500 bg-white px-4 py-2 text-xs font-semibold text-black dark:bg-black dark:text-white"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setDeleteOpen(true);
                  }}
                  className="flex w-full items-center justify-center rounded-lg border border-gray-500 bg-white px-4 py-2 text-xs font-semibold text-black dark:bg-black dark:text-white"
                >
                  Delete
                </button>
              </div>
              <div className="flex w-full flex-col space-y-4 divide-y divide-gray-200 pt-4 text-black dark:divide-gray-800 dark:text-white">
                <p className="text-md font-semibold">Limits</p>
                <div className="flex w-full flex-row items-center justify-between space-x-2 pr-4 pt-4">
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">Costs</p>
                    <p className="text-sm text-gray-500">{`${
                      orgLimits?.cost === -1
                        ? "unlimited"
                        : new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(orgLimits?.cost || 0)
                    }`}</p>
                  </div>
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">Requests</p>
                    <p className="text-sm text-gray-500">
                      {orgLimits?.requests === -1
                        ? "unlimited"
                        : new Intl.NumberFormat("en-US").format(
                            orgLimits?.requests || 0,
                          )}
                    </p>
                  </div>
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">Time Range</p>
                    <p className="text-sm text-gray-500">Monthly</p>
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-col space-y-4 divide-y divide-gray-200 pt-8 text-black dark:divide-gray-800 dark:text-white">
                <p className="text-md font-semibold">Details</p>
                <div className="flex flex-col space-y-4 pr-4 pt-4">
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">Created At</p>
                    <p className="text-sm text-gray-500">
                      {getUSDateFromString(org?.created_at || "")}
                    </p>
                  </div>
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">Organization ID</p>
                    <p className="text-sm text-gray-500">{org?.id}</p>
                  </div>
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">Owner</p>
                    <p className="text-sm text-gray-500">
                      {owner?.email || "n/a"}
                    </p>
                  </div>
                  <div className="flex flex-col items-start space-y-1">
                    <p className="text-sm font-semibold">Members</p>
                    <p className="text-sm text-gray-500">
                      {members?.length || "n/a"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex h-full w-full flex-col">
              <Tabs defaultValue="usage" className="w-full">
                <TabsList>
                  <TabsTrigger value="usage">Usage</TabsTrigger>
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="keys">Keys</TabsTrigger>
                </TabsList>
                <TabsContent value="usage">
                  <div className="pt-4">
                    <StyledAreaChart
                      title={"Requests Over Time"}
                      value={undefined}
                      isDataOverTimeLoading={false}
                      height="400px"
                    >
                      <AreaChart
                        data={chartData}
                        categories={["requests"]}
                        index={"date"}
                        colors={["emerald"]}
                        className="h-full w-full pt-8"
                        showLegend={false}
                        curveType="monotone"
                      />
                    </StyledAreaChart>
                  </div>
                </TabsContent>
                <TabsContent value="members">
                  {org && <OrgMembersPage org={org} wFull={true} />}
                </TabsContent>
                <TabsContent value="keys">
                  <div className="pt-4">
                    <ProviderKeyList
                      orgProviderKey={org?.org_provider_key || ""}
                      orgId={org?.id}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </div>
      <EditCustomerOrgModal
        open={editOpen}
        setOpen={setEditOpen}
        onSuccess={() => {
          refetch();
        }}
        initialValues={{
          color: org?.color || "",
          icon: org?.icon || "",
          name: org?.name || "",
          id: org?.id || "",
          limits: org?.limits as OrgLimits,
          providerKey: org?.org_provider_key || "",
        }}
      />
      <DeleteOrgModal
        open={deleteOpen}
        setOpen={setDeleteOpen}
        orgId={org?.id || ""}
        orgName={org?.name || ""}
        onDeleteRoute={"/enterprise/portal"}
      />
    </div>
  );
};

export default PortalIdPage;
