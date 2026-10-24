import { redirect } from "next/navigation";

export default function MisspelledCalendarRoute() {
  redirect("/calendar");
}
