export const classes = [
  {
    id: "drugAllergies",
    title: "Drug Allergies",
    color: { r: 255, g: 192, b: 192 },
  },
  {
    id: "imagingNote",
    title: "Imaging Note",
    color: { r: 209, g: 209, b: 255 },
  },
  {
    id: "labResults",
    title: "Lab Results",
    color: { r: 213, g: 255, b: 213 },
  },
  {
    id: "procedureNotes",
    title: "Procedure Notes",
    color: { r: 100, g: 200, b: 150 },
  },
  {
    id: "providerFacilityNotes",
    title: "Provider-Facility Notes",
    color: { r: 150, g: 100, b: 250 },
  },
  {
    id: "vaccinationsImmunizations",
    title: "Vaccinations-Immunizations",
    color: { r: 120, g: 190, b: 100 },
  },
  {
    id: "documents",
    title: "Documents",
    color: { r: 210, g: 220, b: 110 },
  },
  {
    id: "other",
    title: "Other",
    color: { r: 200, g: 200, b: 200 },
  },
];

// Helper function to check if a page is already finalised
function isPageFinalised(pageIndex) {
  const finalisedData = JSON.parse(
    localStorage.getItem("finalisedData") || "[]"
  );
  return finalisedData.some(
    (item) =>
      item.label !== "Temporary" &&
      item.pages.some((page) => page.pageIndex === pageIndex)
  );
}

// Enable or disable the download button based on whether all pages are finalised
export function enableDownIfAllFinalised() {
  const totalPages = window.instance.totalPageCount;
  const finalisedData = JSON.parse(
    localStorage.getItem("finalisedData") || "[]"
  );

  // Create a set of all finalised page indices
  const finalisedPages = new Set(
    finalisedData.flatMap((item) => {
      if(item.label !== "Temporary") 
        return item.pages.map((page) => page.pageIndex);
    })
  );

  finalisedPages.delete(undefined);

  const isEveryPageFinalised = finalisedPages.size === totalPages;

  // Update the download button state
  window.instance.setDocumentEditorToolbarItems((items) => {
    items.map((item) => {
      if (item.id === "DownClasses") {
        item.disabled = !isEveryPageFinalised;
      }
      return item;
    });
    return items;
  });
}

export function downloadFile(buffer, filename) {
  const blob = new Blob([buffer], {
    type: "application/pdf",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Save finalised data to localStorage
export function saveFinalisation(label, pages) {
  let finalisedData = JSON.parse(localStorage.getItem("finalisedData") || "[]");
  finalisedData.push({ label, pages });
  localStorage.setItem("finalisedData", JSON.stringify(finalisedData));
}

// Get all finalised pages from localStorage
export function getFinalisedPages() {
  let finalisedData = JSON.parse(localStorage.getItem("finalisedData") || "[]");
  return finalisedData.flatMap((item) => item.pages);
}

// Apply stored finalisations to the document UI
export function applyStoredFinalisations() {
  setTimeout(() => {
    let finalisedData = JSON.parse(
      localStorage.getItem("finalisedData") || "[]"
    );
    finalisedData.forEach((item) => {
      item.pages.forEach((page) => {
        page.classes.forEach((classId) => {
          const classItem = classes.find((c) => c.id === classId);
          if (classItem) {
            transformThumbnailUI(page.pageIndex, classItem.color, item.label);
          }
        });
      });
    });
    enableDownIfAllFinalised();
  }, 100);
}

export async function downloadMultiplePDFsAsZip(pdfBuffers, zipFilename) {
  const zip = new JSZip();

  // Add each PDF buffer to the zip file
  pdfBuffers.forEach(({ buffer, filename }) => {
    zip.file(filename, buffer, { binary: true });
  });

  // Generate the zip file and trigger the download
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(zipBlob);
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function transformThumbnailUI(pageIndex, color, label) {
  const thumbnail = window.instance.contentDocument.querySelector(
    `.PSPDFKit-DocumentEditor-Thumbnails-Page[data-page-index="${pageIndex}"]`
  );

  if (!thumbnail) {
    console.error(`Thumbnail for page ${pageIndex} not found`);
    return;
  }

  let circleContainer = thumbnail.querySelector(".circle-container");

  if (!circleContainer) {
    circleContainer = document.createElement("div");
    circleContainer.classList.add("circle-container");
    circleContainer.style.display = "flex";
    circleContainer.style.justifyContent = "center";
    circleContainer.style.alignItems = "center";
    circleContainer.style.height = "28px";
    circleContainer.style.marginTop = "-2px";
    circleContainer.style.marginBottom = "2px";
    circleContainer.style.overflowX = "auto";
    circleContainer.style.overflowY = "hidden";
    circleContainer.style.whiteSpace = "nowrap";
    circleContainer.style.paddingBottom = "5px";

    circleContainer.style.scrollbarWidth = "thin";
    circleContainer.style.scrollbarColor = "#888 #f1f1f1";

    thumbnail.appendChild(circleContainer);

    thumbnail.style.height = `${parseInt(thumbnail.style.height) + 38}px`;
  }

  // Create and add new color circle
  const circle = createColorCircle(color, label !== "Temporary");
  circle.classList.add("color-circle");
  circle.style.flexShrink = "0";
  circle.style.marginRight = "6px";

  // Add tooltip functionality
  if (label !== "Temporary") {
    circle.setAttribute("title", label);
    circle.style.cursor = "pointer";

    // Create a tooltip element
    const tooltip = document.createElement("div");
    tooltip.id = `tooltip-${pageIndex}`;
    tooltip.textContent = label;
    tooltip.style.position = "absolute";
    tooltip.style.backgroundColor = "grey";
    tooltip.style.opacity = 0.6;
    tooltip.style.color = "white";
    tooltip.style.padding = "3px 8px";
    tooltip.style.borderRadius = "3px";
    tooltip.style.zIndex = "1000";
    tooltip.style.display = "none";

    // Show tooltip on mouseover
    circle.addEventListener("mouseover", (e) => {
      tooltip.style.display = "block";
      tooltip.style.left = `${e.pageX + 10}px`;
      tooltip.style.top = `${e.pageY + 10}px`;
      document.body.appendChild(tooltip);
    });

    // Hide tooltip on mouseout
    circle.addEventListener("mouseout", () => {
      tooltip.style.display = "none";
      document.body.removeChild(tooltip);
    });
  }

  circleContainer.appendChild(circle);
}

// Helper function to create a color circle SVG
function createColorCircle(color, hasBorder = false) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "18");
  svg.setAttribute("height", "18");

  // Define the filter for drop shadow
  const filter = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "filter"
  );
  filter.setAttribute("id", "drop-shadow");
  filter.innerHTML = `
    <feGaussianBlur in="SourceAlpha" stdDeviation="0.7" result="blur"/>
    <feOffset in="blur" dx="0.7" dy="0.7" result="offsetBlur"/>
    <feMerge>
      <feMergeNode in="offsetBlur"/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  `;
  svg.appendChild(filter);

  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  circle.setAttribute("cx", "9");
  circle.setAttribute("cy", "9");
  circle.setAttribute("r", "7.5");
  circle.setAttribute("fill", `rgb(${color.r},${color.g},${color.b})`);

  if (hasBorder) {
    circle.setAttribute("stroke", "black");
    circle.setAttribute("stroke-width", "1");
  }

  circle.setAttribute("filter", "url(#drop-shadow)");

  svg.appendChild(circle);
  return svg;
}

// Generate "Add to Class" buttons for each class
export function generateAddToClasses(classes) {
  return classes.map((classItem) => {
    return {
      type: "custom",
      id: classItem.id,
      className: classItem.id,
      title: `${classItem.title}`,
      onPress: (event, { setOperations, getSelectedPageIndexes }) => {
        const selectedPages = getSelectedPageIndexes();
        if (selectedPages.length === 0) {
          alert(`Please select some pages to add to ${classItem.title}`);
          return;
        } else {
          // Filter out already finalised pages
          const nonFinalisedPages = selectedPages.filter(
            (pageIndex) => !isPageFinalised(pageIndex)
          );

          if (nonFinalisedPages.length === 0) {
            alert(
              "All selected pages are already finalised. You cannot add more classifications to finalised pages."
            );
            return;
          }

          if (nonFinalisedPages.length < selectedPages.length) {
            alert(
              `Some selected pages are already finalised and will be skipped. Proceeding with ${nonFinalisedPages.length} non-finalised pages.`
            );
          }

          // Update UI for non-finalised pages
          nonFinalisedPages.forEach((pageIndex) => {
            transformThumbnailUI(pageIndex, classItem.color, "Temporary");
          });

          // Update finalisedData in localStorage
          let finalisedData = JSON.parse(
            localStorage.getItem("finalisedData") || "[]"
          );
          let existingItem = finalisedData.find(
            (item) => item.label === "Temporary"
          );
          if (!existingItem) {
            existingItem = { label: "Temporary", pages: [] };
            finalisedData.push(existingItem);
          }

          // Add or update pages in the temporary item
          nonFinalisedPages.forEach((pageIndex) => {
            let existingPage = existingItem.pages.find(
              (p) => p.pageIndex === pageIndex
            );
            if (existingPage) {
              if (!existingPage.classes.includes(classItem.id)) {
                existingPage.classes.push(classItem.id);
              }
            } else {
              existingItem.pages.push({ pageIndex, classes: [classItem.id] });
            }
          });

          localStorage.setItem("finalisedData", JSON.stringify(finalisedData));
          enableDownIfAllFinalised();
        }
      },
    };
  });
}

// Configuration for the "Download All" button
// export const downloadAllClass = {
//   type: "custom",
//   id: "DownClasses",
//   className: "class",
//   title: "Download Zip",
//   disabled: true,
//   onPress: async (event) => {
//     const finalisedData = JSON.parse(
//       localStorage.getItem("finalisedData") || "[]"
//     );
//     const pdfBuffers = await Promise.all(
//       finalisedData.map(async (item) => {
//         if (item.pages && item.pages.length > 0) {
//           const operations = [
//             {
//               type: "keepPages",
//               pageIndexes: item.pages.map((p) => p.pageIndex),
//             },
//           ];
//           const pdfBuffer = await window.instance.exportPDFWithOperations(
//             operations
//           );
//           return { buffer: pdfBuffer, filename: `${item.label}.pdf` };
//         }
//         return null;
//       })
//     );

//     const validPdfBuffers = pdfBuffers.filter((buffer) => buffer !== null);
//     if (validPdfBuffers.length > 0) {
//       downloadMultiplePDFsAsZip(validPdfBuffers, "documents.zip");
//     } else {
//       alert("No finalised pages to download.");
//     }
//   },
// };

export const downloadAllClass = {
  type: "custom",
  id: "DownClasses",
  className: "class",
  title: "Download Zip",
  disabled: true,
  onPress: async (event) => {
    const finalisedData = JSON.parse(
      localStorage.getItem("finalisedData") || "[]"
    );

    if (finalisedData.length === 0) {
      alert("No finalised pages to download.");
      return;
    }

    const zip = new JSZip();

    // Loop through each classification
    await Promise.all(
      finalisedData.map(async (item) => {
        if (item.pages && item.pages.length > 0) {
          const classifiedPagesByClass = {};

          // Organize pages by their classifications
          item.pages.forEach((page) => {
            page.classes.forEach((classId) => {
              if (!classifiedPagesByClass[classId]) {
                classifiedPagesByClass[classId] = [];
              }
              classifiedPagesByClass[classId].push(page.pageIndex);
            });
          });

          // For each classification, create a folder and add the relevant pages
          await Promise.all(
            Object.entries(classifiedPagesByClass).map(
              async ([classId, pageIndexes]) => {
                const classItem = classes.find((c) => c.id === classId);
                const folderName = classItem ? classItem.title : "Unknown";

                // Create a folder for each classification
                const folder = zip.folder(folderName);

                // Export classified pages as PDFs
                const operations = [
                  {
                    type: "keepPages",
                    pageIndexes: pageIndexes,
                  },
                ];
                const pdfBuffer = await window.instance.exportPDFWithOperations(
                  operations
                );

                // Add the PDF to the corresponding folder with the item.label as filename
                folder.file(`${item.label}.pdf`, pdfBuffer, { binary: true });
              }
            )
          );
        }
      })
    );

    // Generate the zip file and trigger the download
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipBlob);
    link.download = "classified_documents.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};


export const Clear = {
  type: "custom",
  id: "Clear",
  className: "class",
  title: "Reset",
  disabled: false,
  onPress: async (event) => {
    localStorage.clear();
    window.location.reload();
    enableDownIfClassified();
  },
};

// Configuration for the "Finalise" button
export const finalise = {
  type: "custom",
  id: "Finalise",
  className: "class",
  title: "Finalise",
  disabled: false,
  onPress: async (event, { setOperations, getSelectedPageIndexes }) => {
    const selectedPages = getSelectedPageIndexes();

    if (selectedPages.length === 0) {
      alert("Please select some pages to finalise");
      return;
    }

    // Filter out already finalised pages
    const nonFinalisedPages = selectedPages.filter(
      (pageIndex) => !isPageFinalised(pageIndex)
    );

    if (nonFinalisedPages.length === 0) {
      alert(
        "All selected pages are already finalised. You cannot finalise pages more than once."
      );
      return;
    }

    // Check if all non-finalised pages have at least one classification
    let finalisedData = JSON.parse(
      localStorage.getItem("finalisedData") || "[]"
    );
    const temporaryItem = finalisedData.find(
      (item) => item.label === "Temporary"
    );

    const pagesWithoutClassification = nonFinalisedPages.filter((pageIndex) => {
      const existingPage = temporaryItem
        ? temporaryItem.pages.find((p) => p.pageIndex === pageIndex)
        : null;
      return !existingPage || existingPage.classes.length === 0;
    });

    if (pagesWithoutClassification.length > 0) {
      alert(
        `Some pages don't have any classification. Please add at least one classification to all selected pages before finalising.`
      );
      return;
    }

    if (nonFinalisedPages.length < selectedPages.length) {
      alert(
        `Some selected pages are already finalised and will be skipped. Proceeding with ${nonFinalisedPages.length} non-finalised pages.`
      );
    }

    const label = window.prompt("Label");
    if (label !== null && label !== "") {
      let finalisedData = JSON.parse(
        localStorage.getItem("finalisedData") || "[]"
      );
      const temporaryItem = finalisedData.find(
        (item) => item.label === "Temporary"
      );

      // Create finalised pages from selected non-finalised pages
      const finalizedPages = nonFinalisedPages.map((pageIndex) => {
        const existingPage = temporaryItem
          ? temporaryItem.pages.find((p) => p.pageIndex === pageIndex)
          : null;
        return {
          pageIndex: pageIndex,
          classes: existingPage ? existingPage.classes : [],
        };
      });

      // Create new finalised item
      const newItem = {
        label: label,
        pages: finalizedPages,
      };

      // Remove the pages from the temporary item
      if (temporaryItem) {
        temporaryItem.pages = temporaryItem.pages.filter(
          (p) => !nonFinalisedPages.includes(p.pageIndex)
        );
      }

      finalisedData.push(newItem);

      // Remove the temporary item if it's empty
      finalisedData = finalisedData.filter(
        (item) => item.label !== "Temporary" || item.pages.length > 0
      );

      localStorage.setItem("finalisedData", JSON.stringify(finalisedData));
      console.log("Finalized data:", finalisedData);
      alert(`Finalised ${nonFinalisedPages.length} pages`);
      // applyStoredFinalisations();
      enableDownIfAllFinalised();
      window.location.reload();
    }
  },
};
