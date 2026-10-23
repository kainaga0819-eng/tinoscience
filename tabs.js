// Shows one section at a time based on the tab clicked (or the #name in the URL).

const tabs = document.querySelectorAll(".tabs a");
const panels = document.querySelectorAll(".tab-panel");

function showTab(name) {
  // Fall back to Home if the URL has no #name or an unknown one
  if (!document.getElementById(name)) name = "home";

  panels.forEach(panel => panel.hidden = panel.id !== name);
  tabs.forEach(tab => tab.classList.toggle("active", tab.dataset.tab === name));
}

// Clicking a tab changes the #name in the URL, which fires "hashchange"
window.addEventListener("hashchange", () => {
  showTab(location.hash.slice(1));
  window.scrollTo(0, 0);
});

showTab(location.hash.slice(1));
