// Opens the site-wide advisor widget from anywhere (optionally asking a question).
export const OPEN_ADVISOR_EVENT = "lumen:open-advisor";
export type OpenAdvisorDetail = { prompt?: string };

export function openAdvisor(prompt?: string) {
  window.dispatchEvent(new CustomEvent<OpenAdvisorDetail>(OPEN_ADVISOR_EVENT, { detail: { prompt } }));
}
