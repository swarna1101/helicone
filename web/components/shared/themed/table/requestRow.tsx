import { ChevronRightIcon } from "@heroicons/react/20/solid";

import ModelPill from "../../../templates/requests/modelPill";
import StatusBadge from "../../../templates/requests/statusBadge";
import { formatNumber } from "../../../templates/users/initialColumns";
import { clsx } from "../../clsx";
import { useState } from "react";
import CostPill from "../../../templates/requests/costPill";
import { getUSDateFromString } from "../../utils/utils";
import { MappedLLMRequest } from "@helicone-package/llm-mapper/types";

interface RequestRowProps {
  index: number;
  length: number;
  isSelected: boolean;
  row: MappedLLMRequest;
  onSelectRow: (row: MappedLLMRequest) => void;
  properties: string[];
}

const RequestRow = (props: RequestRowProps) => {
  const { index, length, isSelected, row, onSelectRow, properties } = props;

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <li
      key={"request-row-view-" + index}
      className={clsx(
        index === length - 1 && "border-b",
        index === 0 && "border-t",
        isSelected ? "bg-gray-200 dark:bg-gray-800" : "bg-white dark:bg-black",
        isSelected
          ? "sticky bottom-0 top-0 border-gray-500"
          : "border-gray-300",
        "flex w-full flex-col space-y-4 border-l border-r p-4 text-gray-900 hover:cursor-pointer hover:bg-gray-200 dark:border-gray-800 dark:text-gray-100 dark:hover:bg-gray-900",
      )}
      onClick={() => {
        if (isSelected) {
          setIsExpanded(!isExpanded);
        }
        onSelectRow(row);
      }}
    >
      <div className="flex flex-row items-center space-x-4">
        <p className="text-sm font-semibold">
          {getUSDateFromString(row.heliconeMetadata.createdAt)}
        </p>
        <StatusBadge
          statusType={row.heliconeMetadata.status.statusType}
          errorCode={row.heliconeMetadata.status.code}
        />
      </div>
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <ModelPill
            model={row.model}
            provider={row.heliconeMetadata.provider}
          />
          <p className="text-xs font-semibold">
            {Number(row.heliconeMetadata.latency) / 1000}s
          </p>
          {row.heliconeMetadata.cost !== null ? (
            <p className="text-xs font-semibold">
              ${formatNumber(row.heliconeMetadata.cost)}
            </p>
          ) : row.heliconeMetadata.status &&
            row.heliconeMetadata.status.code === 200 ? (
            <CostPill />
          ) : (
            <p className="text-xs font-semibold"></p>
          )}
        </div>

        <ChevronRightIcon
          className={clsx(
            isSelected && isExpanded && "rotate-90 transform",
            "h-4 w-4 text-gray-500",
          )}
        />
      </div>

      {isSelected && isExpanded && (
        <div className="flex flex-col space-y-4 text-gray-900 dark:text-gray-100">
          <p className="text-sm">
            <span className="font-semibold">User:</span>{" "}
            {row.heliconeMetadata.user}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Total Tokens:</span>{" "}
            {row.heliconeMetadata.totalTokens}{" "}
            <span className="text-xs text-gray-500">
              (Completion: {row.heliconeMetadata.completionTokens} / Prompt:{" "}
              {row.heliconeMetadata.promptTokens})
            </span>
          </p>
          {row.heliconeMetadata.customProperties &&
            properties.length > 0 &&
            Object.keys(row.heliconeMetadata.customProperties).length > 0 && (
              <>
                {properties.map((property, i) => {
                  if (
                    row.heliconeMetadata.customProperties &&
                    row.heliconeMetadata.customProperties.hasOwnProperty(
                      property,
                    )
                  ) {
                    return (
                      <p className="text-sm" key={i}>
                        <span className="font-semibold">{property}:</span>{" "}
                        {
                          row.heliconeMetadata.customProperties[
                            property
                          ] as string
                        }
                      </p>
                    );
                  }
                })}
              </>
            )}
        </div>
      )}
    </li>
  );
};

export default RequestRow;
