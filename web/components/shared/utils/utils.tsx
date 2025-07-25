const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const getUSDateShort = (value: string) => {
  const date = new Date(value);
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  return `${month} ${day}`;
};

const getUSDate = (date: Date, includeTimeZone: boolean = false) => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: includeTimeZone ? "short" : undefined,
  };

  let formattedDate = date.toLocaleString("en-US", options);
  // Remove the year and 'at' from the string
  formattedDate = formattedDate
    .replace(", " + date.getFullYear(), "")
    .replace(" at", "");

  return formattedDate;
};

const getUSDateFromString = (
  value: string,
  includeTimeZone: boolean = false,
) => {
  const date = new Date(value);
  return getUSDate(date, includeTimeZone);
};

const get24HourFromDate = (date: Date) => {
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
  });
};

const get24HourFromString = (value: string) => {
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
  });
};

const getUSDateMin = (value: string) => {
  const date = new Date(value);
  const day = date.getDate();
  return `${date.getMonth()}/${day}/${date
    .getFullYear()
    .toString()
    .slice(-2)}, ${date.toLocaleTimeString().slice(0, -6)} ${date
    .toLocaleTimeString()
    .slice(-2)}`;
};

const capitalizeWords = (str: string) => {
  // replace underscores with spaces
  const strWithSpaces = str.replace(/_/g, " ");

  // split the string into an array of words
  const words = strWithSpaces.split(" ");

  // map over each word and capitalize the first letter
  const capitalizedWords = words.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1),
  );

  // join the capitalized words back into a single string
  return capitalizedWords.join(" ");
};

function removeLeadingWhitespace(str: string | null): string {
  if (typeof str !== "string") return "";
  return str.replace(/^\s+/, ""); // Replace one or more whitespace characters at the beginning of the string with an empty string
}

export {
  capitalizeWords,
  getUSDate,
  getUSDateFromString,
  get24HourFromDate,
  get24HourFromString,
  getUSDateMin,
  getUSDateShort,
  removeLeadingWhitespace,
};
