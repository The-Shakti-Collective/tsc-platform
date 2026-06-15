import MasterclassReviewTemplate, { CourseLink } from "@/components/reviews/MasterclassReviewTemplate";

export default function MasterclassReview01() {
  const successLinks: CourseLink[] = [
    {
      title: "Foundation Course",
      url: "https://tscacademy.exlyapp.com/checkout/c9a2ca8d-dfaa-4db8-ac7b-a558433df4b8?dynamic_link=fb61323e-d4ca-4d92-a0a0-da337ad229d1",
      colorTheme: "emerald",
    },
    {
      title: "Acceleration Course",
      url: "https://tscacademy.exlyapp.com/checkout/245f8992-f7bd-41c2-aa48-864a1ac2b9cd",
      colorTheme: "sky",
    },
  ];

  return (
    <MasterclassReviewTemplate
      pageTitle="Masterclass Review 01 | TSC Academy"
      pageHeaderTitle="The Roots of Hindustani Classical Music - Masterclass Review"
      pageHeaderDescription="Help us improve your learning journey for The Roots of Hindustani Classical Music. This form mixes quick MCQs with focused written inputs so we can identify what worked, what to improve, and how we can support your next step."
      apiEndpoint="/api/reviews"
      successLinks={successLinks}
    />
  );
}
