import { PageHeader } from "@/components/dashboard/DashboardUI"
import JuniorReportSheet from "@/components/ui/JuniorReport"
import SeniorReportSheet from "@/components/ui/SeniorReport"

export default function AdminResultGeneratorPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Reports"
                title="Result Generator"
                text="Configure subject weighting, grading scales, and header layouts to generate class and student result slips."
            />
            <SeniorReportSheet /> <JuniorReportSheet />
        </div>
    )
}