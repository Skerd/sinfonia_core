import axios from "axios";

/** Whether a request failed because it was cancelled; axios itself stays behind `helpers/apiClient` (D09). */
export const isRequestCancelled = axios.isCancel;
