import {
  Edit,
  Plus,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import api from "../api/axios";
import { RowItemSkeleton } from "../components/Skeleton";


const initialForm = {
  name: "",
  description: "",
  icon: "",
  is_active: true,
};


function AdminCategories() {
  const [categories, setCategories] =
    useState([]);

  const [formData, setFormData] =
    useState(initialForm);

  const [editingId, setEditingId] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [errors, setErrors] =
    useState({});


  const fetchCategories = useCallback(
    async () => {
      const response =
        await api.get(
          "/admin/categories/",
        );

      const data =
        response.data.results ||
        response.data ||
        [];

      return Array.isArray(data)
        ? data
        : [];
    },
    [],
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      setError("");

      try {
        const categories =
          await fetchCategories();

        if (active) {
          setCategories(
            categories,
          );
        }
      } catch (requestError) {
        console.error(
          "Admin categories error:",
          requestError.response?.data ||
            requestError,
        );

        if (active) {
          setError(
            requestError.response?.data?.detail ||
              "Unable to load categories.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [fetchCategories]);


  const handleChange = (
    event,
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };


  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setErrors({});
  };


  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setMessage("");
    setErrors({});

    try {
      if (editingId) {
        const response =
          await api.patch(
            `/admin/categories/${editingId}/`,
            formData,
          );

        setCategories(
          (previous) =>
            previous.map(
              (category) =>
                category.id === editingId
                  ? response.data
                  : category,
            ),
        );

        setMessage(
          "Category updated successfully.",
        );
      } else {
        const response =
          await api.post(
            "/admin/categories/",
            formData,
          );

        setCategories(
          (previous) => [
            ...previous,
            response.data,
          ],
        );

        setMessage(
          "Category created successfully.",
        );
      }

      resetForm();
    } catch (requestError) {
      const apiErrors =
        requestError.response?.data;

      if (
        apiErrors &&
        typeof apiErrors ===
          "object"
      ) {
        setErrors(apiErrors);
      }

      setError(
        apiErrors?.detail ||
          "Unable to save category.",
      );
    } finally {
      setSubmitting(false);
    }
  };


  const handleEdit = (
    category,
  ) => {
    setEditingId(category.id);

    setFormData({
      name: category.name || "",
      description:
        category.description || "",
      icon: category.icon || "",
      is_active:
        category.is_active ?? true,
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  const handleDelete = async (
    category,
  ) => {
    const confirmed =
      window.confirm(
        `Delete category "${category.name}"?`,
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(category.id);
    setError("");
    setMessage("");

    try {
      await api.delete(
        `/admin/categories/${category.id}/`,
      );

      setCategories(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              category.id,
          ),
      );

      setMessage(
        "Category deleted successfully.",
      );

      if (
        editingId === category.id
      ) {
        resetForm();
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to delete category.",
      );
    } finally {
      setDeletingId(null);
    }
  };


  const filteredCategories =
    categories.filter(
      (category) => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (!query) {
          return true;
        }

        return (
          category.name
            ?.toLowerCase()
            .includes(query) ||
          category.description
            ?.toLowerCase()
            .includes(query)
        );
      },
    );


  return (
    <section className="mx-auto max-w-7xl px-6 py-12">

      <div className="mb-8">

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">
          Administration
        </p>

        <h1 className="mt-2 text-4xl font-bold text-slate-900">
          Manage Categories
        </h1>

        <p className="mt-3 text-slate-600">
          Create, edit and manage
          event categories.
        </p>

      </div>


      {message && (
        <div className="mb-6 rounded-xl bg-green-50 px-5 py-4 text-green-700">
          {message}
        </div>
      )}


      {error && (
        <div className="mb-6 rounded-xl bg-red-50 px-5 py-4 text-red-700">
          {error}
        </div>
      )}


      {/* FORM */}

      <section className="mb-10 rounded-2xl bg-white p-7 shadow-sm">

        <div className="flex items-center justify-between gap-4">

          <div>

            <h2 className="text-2xl font-bold text-slate-900">

              {editingId
                ? "Edit Category"
                : "Create Category"}

            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Categories help users
              discover relevant events.
            </p>

          </div>


          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
            >
              <X size={17} />

              Cancel Edit
            </button>
          )}

        </div>


        <form
          onSubmit={handleSubmit}
          className="mt-7 space-y-5"
        >

          <div className="grid gap-5 md:grid-cols-2">

            <FormField
              label="Category Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Example: Running"
              required
            />


            <FormField
              label="Icon"
              name="icon"
              value={formData.icon}
              onChange={handleChange}
              error={errors.icon}
              placeholder="Example: running"
            />

          </div>


          <div>

            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              rows={4}
              value={
                formData.description
              }
              onChange={handleChange}
              placeholder="Describe this category..."
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
            />

            <FieldError
              error={
                errors.description
              }
            />

          </div>


          <label className="flex items-center gap-3">

            <input
              type="checkbox"
              name="is_active"
              checked={
                formData.is_active
              }
              onChange={handleChange}
              className="h-4 w-4"
            />

            <span className="text-sm font-medium text-slate-700">
              Active category
            </span>

          </label>


          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800 disabled:opacity-50"
          >

            {editingId ? (
              <Edit size={18} />
            ) : (
              <Plus size={18} />
            )}

            {submitting
              ? "Saving..."
              : editingId
                ? "Update Category"
                : "Create Category"}

          </button>

        </form>

      </section>


      {/* CATEGORY LIST */}

      <section>

        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>

            <h2 className="text-2xl font-bold text-slate-900">
              Categories
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {categories.length} total
              categories.
            </p>

          </div>


          <div className="relative w-full sm:w-80">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search categories..."
              className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-indigo-500"
            />

          </div>

        </div>


        {loading ? (
          <RowItemSkeleton rows={5} />
        ) : !error && filteredCategories.length ===
          0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">

            <Tags
              size={45}
              className="mx-auto text-slate-400"
            />

            <h3 className="mt-4 text-xl font-bold text-slate-900">
              No categories found
            </h3>

          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

            <div className="overflow-x-auto">

              <table className="min-w-full">

                <thead className="bg-slate-50">

                  <tr>
                    <TableHeader>
                      Category
                    </TableHeader>

                    <TableHeader>
                      Description
                    </TableHeader>

                    <TableHeader>
                      Status
                    </TableHeader>

                    <TableHeader>
                      Created
                    </TableHeader>

                    <TableHeader>
                      Actions
                    </TableHeader>
                  </tr>

                </thead>


                <tbody className="divide-y divide-slate-200">

                  {filteredCategories.map(
                    (category) => (
                      <tr
                        key={
                          category.id
                        }
                        className="hover:bg-slate-50"
                      >

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">

                              <Tags
                                size={19}
                              />

                            </div>


                            <div>

                              <p className="font-semibold text-slate-900">
                                {
                                  category.name
                                }
                              </p>

                              {category.icon && (
                                <p className="mt-1 text-xs text-slate-400">
                                  Icon:{" "}
                                  {
                                    category.icon
                                  }
                                </p>
                              )}

                            </div>

                          </div>

                        </td>


                        <td className="max-w-md px-6 py-5 text-sm text-slate-600">

                          {category.description ||
                            "No description"}

                        </td>


                        <td className="px-6 py-5">

                          {category.is_active ? (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                              Inactive
                            </span>
                          )}

                        </td>


                        <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">

                          {category.created_at
                            ? new Date(
                                category.created_at,
                              ).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month:
                                    "short",
                                  year:
                                    "numeric",
                                },
                              )
                            : "-"}

                        </td>


                        <td className="px-6 py-5">

                          <div className="flex gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(
                                  category,
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-indigo-600 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                            >
                              <Edit
                                size={16}
                              />

                              Edit
                            </button>


                            <button
                              type="button"
                              disabled={
                                deletingId ===
                                category.id
                              }
                              onClick={() =>
                                handleDelete(
                                  category,
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-red-600 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2
                                size={16}
                              />

                              {deletingId ===
                              category.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>

                          </div>

                        </td>

                      </tr>
                    ),
                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}

      </section>

    </section>
  );
}



function FormField({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  required = false,
}) {
  return (
    <div>

      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
      />

      <FieldError
        error={error}
      />

    </div>
  );
}



function FieldError({
  error,
}) {
  if (!error) {
    return null;
  }

  return (
    <p className="mt-2 text-sm text-red-600">
      {Array.isArray(error)
        ? error[0]
        : error}
    </p>
  );
}



function TableHeader({
  children,
}) {
  return (
    <th className="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}


export default AdminCategories;