const PSPDFKit = window.PSPDFKit;
import {
  classes,
  applyStoredClassifications,
  downloadAllClass,
  generateAddToClasses,
  Clear,
} from "./helpers.js";

// We need to inform PSPDFKit where to look for its library assets, i.e. the location of the `pspdfkit-lib` directory.
// const baseUrl = "https://cdn.cloud.pspdfkit.com/pspdfkit-web@2024.5.2/";
const baseUrl = `${window.location.protocol}//${window.location.host}/assets/`;

// Generate the class buttons like labReport, etc.
const classButtons = generateAddToClasses(classes);

classButtons.push(downloadAllClass,Clear);

// Add the node property to secondHalfClassButtons
const modifiedClassButtons = classButtons.map(button => {
  const node = document.createElement("button");
  node.className = `PSPDFKit-8ehcbhz241z1tfyhjztbe12ube PSPDFKit-5hqvpgcgpf1769cn35dvtg4ktz ${button.className} PSPDFKit-Toolbar-Button PSPDFKit-Tool-Button`;
  node.title = button.title;
  node.setAttribute('aria-label', button.title);
  node.type = 'button';

  const span = document.createElement("span");
  span.textContent = button.title;
  node.appendChild(span);

  return {
    ...button,
    node
  };
});

const docEditToolItems = [
  // ...firstHalfClassButtons,
  { type: "zoom-in", dropdownGroup: "x"},
  { type: "zoom-out" , dropdownGroup: "x"},
  { type: "select-none" , dropdownGroup: "x"},
  downloadAllClass,
  Clear
];

const docEditFootItems = [
  ...modifiedClassButtons,
  // ...PSPDFKit.defaultDocumentEditorFooterItems,
];

const {
  UI: { createBlock, Recipes, Interfaces, Core },
} = PSPDFKit;

(async () => {
  PSPDFKit.load({
    baseUrl,
    container: "#pspdfkit",
    document: "document.pdf",
    toolbarItems: [...PSPDFKit.defaultToolbarItems],
    documentEditorToolbarItems: [...docEditToolItems],
    documentEditorFooterItems: [...docEditFootItems],
    initialViewState: new PSPDFKit.ViewState().set("interactionMode", PSPDFKit.InteractionMode.DOCUMENT_EDITOR),
    styleSheets: [`/style.css`],  
    ui: {
      [Interfaces.DocumentEditor]: ({ props: props }) => {
        return createBlock(Recipes.DocumentEditor, props, ({ ui }) => {
          console.log("Document Editor UI is ready");
          return ui.createComponent();
        }).createComponent();
      },
    },
  })
    .then(async (instance) => {
      // localStorage.clear();
      window.instance = instance;
      applyStoredClassifications();
      instance.addEventListener("viewState.change", (viewState, previousViewState) => {
        if(viewState.get("interactionMode") === PSPDFKit.InteractionMode.DOCUMENT_EDITOR) {
          applyStoredClassifications();
        }
      });
      // console.log(PSPDFKit.defaultDocumentEditorFooterItems);
    })
    .catch((error) => {
      console.error(error.message);
    });
})();
