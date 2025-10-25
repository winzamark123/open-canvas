import { type ExcalidrawFontFaceDescriptor } from "../Fonts";

import OpenSansRegular from "./open-sans-v44-latin-regular.woff2";
import OpenSansBold from "./open-sans-v44-latin-700.woff2";
import OpenSansItalic from "./open-sans-v44-latin-italic.woff2";

export const OpenSansFontFaces: ExcalidrawFontFaceDescriptor[] = [
  {
    uri: OpenSansRegular,
    descriptors: {
      weight: "400",
      style: "normal",
    },
  },
  {
    uri: OpenSansBold,
    descriptors: {
      weight: "700",
      style: "normal",
    },
  },
  {
    uri: OpenSansItalic,
    descriptors: {
      weight: "400",
      style: "italic",
    },
  },
];
