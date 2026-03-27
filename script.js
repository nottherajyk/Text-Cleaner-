const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const cleanButton = document.getElementById("cleanButton");
const copyButton = document.getElementById("copyButton");
const clearButton = document.getElementById("clearButton");
const loadSampleButton = document.getElementById("loadSampleButton");
const pasteSampleButton = document.getElementById("pasteSampleButton");
const copyStatus = document.getElementById("copyStatus");

const optionIds = [
  "trimLines",
  "collapseSpaces",
  "collapseBlankLines",
  "removeBlankLines",
  "normalizeLineBreaks",
];

const inputCount = document.getElementById("inputCount");
const outputCount = document.getElementById("outputCount");
const savedCount = document.getElementById("savedCount");

const sampleText = `   Customer Name:   Raj Kumar
Email:    raj@example.com


City:\t Kolkata
Order Notes:     Please   call before delivery.

  Item 1:   Notebook
  Item 2:    Pen Set   `;

const revealElements = document.querySelectorAll(".reveal");
const typingHeading = document.querySelector(".typing-heading");
let typingRunId = 0;

function getOptions() {
  return optionIds.reduce((options, id) => {
    options[id] = document.getElementById(id).checked;
    return options;
  }, {});
}

function cleanText(text, options) {
  let cleaned = text;

  if (options.normalizeLineBreaks) {
    cleaned = cleaned.replace(/\r\n?/g, "\n");
  }

  if (options.collapseSpaces) {
    cleaned = cleaned.replace(/[^\S\n]+/g, " ");
  }

  if (options.trimLines) {
    cleaned = cleaned
      .split("\n")
      .map((line) => line.trim())
      .join("\n");
  }

  if (options.removeBlankLines) {
    cleaned = cleaned
      .split("\n")
      .filter((line) => line.trim() !== "")
      .join("\n");
  } else if (options.collapseBlankLines) {
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  }

  return cleaned;
}

function updateStats(raw, cleaned) {
  inputCount.textContent = `${raw.length} chars`;
  outputCount.textContent = `${cleaned.length} chars`;
  savedCount.textContent = `${Math.max(raw.length - cleaned.length, 0)} chars`;
}

function renderOutput() {
  const raw = inputText.value;
  const cleaned = cleanText(raw, getOptions());

  outputText.value = cleaned;
  updateStats(raw, cleaned);
  copyStatus.textContent = raw ? "Updated" : "Ready";
}

function loadSample() {
  inputText.value = sampleText;
  renderOutput();
  inputText.focus();
  copyStatus.textContent = "Sample loaded";
}

async function copyOutput() {
  if (!outputText.value) {
    copyStatus.textContent = "Nothing to copy";
    return;
  }

  try {
    await navigator.clipboard.writeText(outputText.value);
    copyStatus.textContent = "Copied";
  } catch (error) {
    outputText.select();
    document.execCommand("copy");
    copyStatus.textContent = "Copied";
  }
}

function clearAll() {
  inputText.value = "";
  outputText.value = "";
  updateStats("", "");
  copyStatus.textContent = "Cleared";
  inputText.focus();
}

function resetTypingAnimation() {
  if (!typingHeading) {
    return;
  }

  typingRunId += 1;
  typingHeading.textContent = typingHeading.dataset.typingText || "";
  typingHeading.classList.remove("is-complete");
  delete typingHeading.dataset.typingStarted;
}

function startTypingAnimation() {
  if (!typingHeading || typingHeading.dataset.typingStarted === "true") {
    return;
  }

  const fullText = typingHeading.dataset.typingText || typingHeading.textContent;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    typingHeading.textContent = fullText;
    typingHeading.classList.add("is-complete");
    typingHeading.dataset.typingStarted = "true";
    return;
  }

  typingHeading.dataset.typingStarted = "true";
  typingHeading.textContent = "";
  typingHeading.classList.remove("is-complete");

  const currentRunId = ++typingRunId;

  let index = 0;

  const typeNextCharacter = () => {
    if (currentRunId !== typingRunId) {
      return;
    }

    typingHeading.textContent = fullText.slice(0, index + 1);
    index += 1;

    if (index < fullText.length) {
      const nextDelay = fullText[index] === "." ? 95 : 52;
      window.setTimeout(typeNextCharacter, nextDelay);
      return;
    }

    typingHeading.classList.add("is-complete");
  };

  window.setTimeout(typeNextCharacter, 180);
}

function setupScrollReveal() {
  if (!("IntersectionObserver" in window)) {
    revealElements.forEach((element) => {
      element.classList.add("reveal-visible");
    });
    startTypingAnimation();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const hasTypingHeading = Boolean(entry.target.querySelector(".typing-heading"));

        if (!entry.isIntersecting) {
          entry.target.classList.remove("reveal-visible");

          if (hasTypingHeading) {
            resetTypingAnimation();
          }

          return;
        }

        const delay = Number(entry.target.dataset.revealDelay || 0);

        window.setTimeout(() => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("reveal-visible");

          if (hasTypingHeading) {
            startTypingAnimation();
          }
        }, delay);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  revealElements.forEach((element) => {
    if (element.classList.contains("reveal-visible")) {
      return;
    }

    observer.observe(element);
  });
}

cleanButton.addEventListener("click", renderOutput);
copyButton.addEventListener("click", copyOutput);
clearButton.addEventListener("click", clearAll);
loadSampleButton.addEventListener("click", loadSample);
pasteSampleButton.addEventListener("click", loadSample);
inputText.addEventListener("input", renderOutput);

optionIds.forEach((id) => {
  document.getElementById(id).addEventListener("change", renderOutput);
});

renderOutput();
setupScrollReveal();
