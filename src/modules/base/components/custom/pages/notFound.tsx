import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import StatusPage from "@baseModule/components/custom/pages/statusPage.tsx";

function NotFound({resolveLanguageKey}: WithLanguageType) {
    return (
        <StatusPage
            code="404"
            title={resolveLanguageKey("title")}
            description={resolveLanguageKey("description")}
            backLabel={resolveLanguageKey("backLabel")}
            backHomeLabel={resolveLanguageKey("backHome")}
        />
    );
}

export default withLanguage("src/modules/core/components/custom/pages/notFound.tsx")(NotFound);
