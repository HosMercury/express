const baseurl = "http://localhost:3000/api/";

// format dates by class
document.addEventListener("DOMContentLoaded", function () {
  const dateElements = document.querySelectorAll(".date");

  dateElements.forEach((el) => {
    const rawDate = el.dataset.date;
    el.innerText = dayjs(rawDate).format("YYYY-MM-DD HH:mm A");
  });
});

new DataTable("#guards", {
  ajax: baseurl + "guards",
  processing: true,
  serverSide: true,
  columns: [
    { data: "id" },
    { data: "name" },
    { data: "title" },
    { data: "experience" },
    {
      data: "created_at",
      render: function (data) {
        return data ? dayjs(data).format("YYYY-MM-DD HH:mm A") : "N/A";
      },
    },
    {
      data: "updated_at",
      render: function (data) {
        return data ? dayjs(data).format("YYYY-MM-DD HH:mm A") : "N/A";
      },
    },
  ],
  rowCallback: function (row, data) {
    $(row).on("click", function () {
      window.location.href = `/guards/${data.id}`;
    });
  },
});
