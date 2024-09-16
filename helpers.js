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
    title: "Provider/ Facility Notes",
    color: { r: 150, g: 100, b: 250 },
  },
  {
    id: "vaccinationsImmunizations",
    title: "Vaccinations/Immunizations",
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

export function saveClassification(classId, pageIndexes) {
  let classData = JSON.parse(localStorage.getItem("classData") || "{}");
  classData[classId] = pageIndexes;
  localStorage.setItem("classData", JSON.stringify(classData));
}

export function getClassification(classId) {
  let classData = JSON.parse(localStorage.getItem("classData") || "{}");
  return classData[classId] || [];
}

export function applyStoredClassifications() {
  setTimeout(() => {
    let classData = JSON.parse(localStorage.getItem("classData") || "{}");
    classes.forEach((classItem) => {
      const storedPages = classData[classItem.id] || [];
      storedPages.forEach((pageIndex) => {
        transformThumbnailUI(pageIndex, classItem.color);
      });
    });
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

function transformThumbnailUI(pageIndex, color) {
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
    circleContainer.style.height = "28px"; // Increased height to accommodate larger circles
    circleContainer.style.marginTop = "5px";
    circleContainer.style.overflowX = "auto";
    circleContainer.style.overflowY = "hidden";
    circleContainer.style.whiteSpace = "nowrap";
    circleContainer.style.paddingBottom = "5px"; // Add some padding to show scrollbar

    // Custom scrollbar styles
    circleContainer.style.scrollbarWidth = "thin";
    circleContainer.style.scrollbarColor = "#888 #f1f1f1";

    // Insert the circle container after the thumbnail content
    thumbnail.appendChild(circleContainer);

    // Adjust the thumbnail's height to accommodate the new container
    thumbnail.style.height = `${parseInt(thumbnail.style.height) + 38}px`; // Increased to account for larger circles
  }

  // Create and add new color circle
  const circle = createColorCircle(color);
  circle.classList.add("color-circle");
  circle.style.flexShrink = "0";
  circle.style.marginRight = "6px"; // Slightly increased margin
  circleContainer.appendChild(circle);
}

function createColorCircle(color) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "18"); // Increased from 12 to 18
  svg.setAttribute("height", "18"); // Increased from 12 to 18

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
  circle.setAttribute("cx", "9"); // Adjusted from 6 to 9
  circle.setAttribute("cy", "9"); // Adjusted from 6 to 9
  circle.setAttribute("r", "7.5"); // Increased from 5 to 7.5
  circle.setAttribute("fill", `rgb(${color.r},${color.g},${color.b})`);
  circle.setAttribute("filter", "url(#drop-shadow)");

  svg.appendChild(circle);
  return svg;
}

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
          selectedPages.forEach((pageIndex) => {
            transformThumbnailUI(pageIndex, classItem.color);
          });
          let classData = JSON.parse(localStorage.getItem("classData") || "{}");
          classData[classItem.id] = (classData[classItem.id] || []).concat(
            selectedPages
          );
          localStorage.setItem("classData", JSON.stringify(classData));
        }
      },
    };
  });
}

export const addToClass2 = {
  type: "custom",
  id: "Class2",
  className: "class2",
  title: "Add to Class 2",
  onPress: (event, { setOperations, getSelectedPageIndexes }) => {
    const selectedPages = getSelectedPageIndexes();
    if (selectedPages.length === 0) {
      alert("Please select some pages to add to Class 2");
      return;
    } else {
      window.instance.setDocumentEditorToolbarItems((items) =>
        items.map((item) => {
          if (item.id === "DownClass2") {
            item.disabled = false;
          }
          return item;
        })
      );
      // getting the page label divs
      selectedPages.map((pageIndex) => {
        transformThumbnailUI(pageIndex, { r: 209, g: 209, b: 255 });
      });
      localStorage.setItem("Class2", JSON.stringify(selectedPages));
    }
  },
};

export const downloadClass2 = {
  type: "custom",
  id: "DownClass2",
  className: "class2",
  title: "Download Class 2",
  disabled: true,
  onPress: (event) => {
    const pagesToExport = JSON.parse(localStorage.getItem("Class2"));
    const operations = [{ type: "keepPages", pageIndexes: pagesToExport }];
    window.instance
      .exportPDFWithOperations(operations)
      .then((pdfArrayBuffer) => {
        downloadFile(pdfArrayBuffer, "class2.pdf");
      });
  },
};

const SaveSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
  <polyline points="17 21 17 13 7 13 7 21"></polyline>
  <polyline points="7 3 7 8 15 8"></polyline>
</svg>
`;

export const downloadAllClass = {
  type: "custom",
  id: "DownClasses",
  title: "Download Zip",
  disabled: false,
  onPress: async (event) => {
    const classData = JSON.parse(localStorage.getItem("classData") || "{}");
    const pdfBuffers = await Promise.all(
      Object.entries(classData).map(async ([classId, pages]) => {
        if (pages && pages.length > 0) {
          const operations = [{ type: "keepPages", pageIndexes: pages }];
          const pdfBuffer = await window.instance.exportPDFWithOperations(
            operations
          );
          return { buffer: pdfBuffer, filename: `${classId}.pdf` };
        }
        return null;
      })
    );

    const validPdfBuffers = pdfBuffers.filter((buffer) => buffer !== null);
    if (validPdfBuffers.length > 0) {
      downloadMultiplePDFsAsZip(validPdfBuffers, "documents.zip");
    } else {
      alert("No classified pages to download.");
    }
  },
};

export const Clear = {
  type: "custom",
  id: "Clear",
  title: "Reset",
  disabled: false,
  onPress: async (event) => {
    localStorage.clear();
    window.location.reload();
  },
};
