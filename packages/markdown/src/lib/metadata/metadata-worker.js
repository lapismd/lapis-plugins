import { handleMetadataWorkerMessage } from "./metadata-worker-protocol";

/**
 * @type {{
 *   onmessage: ((event: MessageEvent<unknown>) => void) | null;
 *   postMessage: (data: unknown) => void;
 * }}
 */
const workerScope = self;

workerScope.onmessage = (event) => {
  const response = handleMetadataWorkerMessage(event.data);
  if (response) {
    workerScope.postMessage(response);
  }
};
