import MasterclassReviewTemplate, { CourseLink } from "@/components/reviews/MasterclassReviewTemplate";

export default function MasterclassReview02() {
  const successLinks: CourseLink[] = [
    {
      title: "Foundation Course",
      url: "https://tscacademy.exlyapp.com/checkout/1d0a602b-3c35-401c-8c43-1b88780520f2",
      colorTheme: "emerald",
    },
    {
      title: "Comprehensive Course",
      url: "https://tscacademy.exlyapp.com/checkout/55bdc656-c92d-4812-a775-944d5becf544",
      colorTheme: "sky",
    },
  ];

  return (
    <MasterclassReviewTemplate
      pageTitle="Masterclass Review 02 | TSC Academy"
      pageHeaderTitle="The heART of Music Composition Masterclass - Review"
      pageHeaderDescription="Help us improve your learning journey for The heART of Music Composition Masterclass by Sandesh Shandilya. This form mixes quick MCQs with focused written inputs so we can identify what worked, what to improve, and how we can support your next step."
      apiEndpoint="/api/reviews02"
      successLinks={successLinks}
    />
  );
}
