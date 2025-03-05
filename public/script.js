const baseurl = "http://localhost:8000/api/";

new DataTable("#guards", {
  ajax: baseurl + "guards",
  processing: true,
  serverSide: true,
  columns: [
    { data: "id" },
    { data: "name" },
    { data: "title" },
    { data: "experience" },
    { data: "created_at" },
    { data: "updated_at" },
  ],
});
