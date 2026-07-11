import { useEffect, useState } from "react";
import { Plus, PencilSimple, Trash, Tag, Robot } from "@phosphor-icons/react";
import { categoryService, type CategoryDto } from "../../services/categoryService";
import { useToast } from "../../hooks/use-toast";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { CategoryModal } from "../../components/admin/CategoryModal";

export function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = () => {
    setLoading(true);
    categoryService.getCategories()
      .then(data => setCategories(data))
      .catch(() => toast({ title: "Error", description: "Could not load categories", variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateOrUpdate = async (data: any) => {
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, data);
        toast({ title: "Success", description: "Category updated successfully." });
      } else {
        await categoryService.createCategory(data);
        toast({ title: "Success", description: "Category created successfully." });
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (e) {
      toast({ title: "Error", description: "Failed to save category.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await categoryService.deleteCategory(deleteTarget.id);
      toast({ title: "Deleted", description: "Category has been removed." });
      fetchCategories();
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete category.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const openEdit = (cat: CategoryDto) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Tag size={22} weight="fill" className="text-indigo-500" />
            Categories Management
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Manage ticket categories and AI auto-routing keywords.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="h-9 px-4 rounded-lg text-[13px] font-medium text-white flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={16} weight="bold" />
          Add Category
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
              <Tag size={24} className="text-slate-400" />
            </div>
            <h3 className="text-[15px] font-semibold text-slate-800">No categories found</h3>
            <p className="text-[13px] text-slate-500 mt-1">Get started by creating a new category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-5 py-3 font-semibold text-slate-600 w-1/4">Category Name</th>
                  <th className="px-5 py-3 font-semibold text-slate-600 w-1/3">Description</th>
                  <th className="px-5 py-3 font-semibold text-slate-600 flex-1">AI Routing Keywords</th>
                  <th className="px-5 py-3 font-semibold text-slate-600 w-[120px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-800">{cat.name}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 truncate max-w-[200px]" title={cat.description}>
                      {cat.description || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {cat.aiRoutingKeywords ? (
                        <div className="flex items-start gap-1.5">
                          <Robot size={15} className="text-indigo-400 shrink-0 mt-0.5" />
                          <p className="text-slate-500 truncate max-w-[250px]" title={cat.aiRoutingKeywords}>
                            {cat.aiRoutingKeywords}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit"
                        >
                          <PencilSimple size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <CategoryModal
        isOpen={isModalOpen}
        initialData={editingCategory}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
      />
    </div>
  );
}
