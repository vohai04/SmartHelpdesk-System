import { useCallback, useEffect, useState } from "react";
import { Plus, PencilSimple, Trash, Tag, Robot } from "@phosphor-icons/react";
import { categoryService, type CategoryDto, type CreateCategoryRequest } from "../../services/categoryService";
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

  const fetchCategories = useCallback(() => {
    setLoading(true);
    categoryService.getCategories()
      .then(data => setCategories(data))
      .catch(() => toast({ title: "Error", description: "Could not load categories", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    const timer=setTimeout(fetchCategories,0);
    return ()=>clearTimeout(timer);
  }, [fetchCategories]);

  const handleCreateOrUpdate = async (data: CreateCategoryRequest) => {
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
    } catch {
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
    } catch {
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
    <div className="categories-page workspace-page space-y-6">
      {/* Header */}
      <div className="page-heading">
        <div className="min-w-0">
          <h1 className="text-[20px] font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            Categories
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">
            Manage ticket categories and AI auto-routing keywords.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="primary-button"
        >
          <Plus size={16} weight="bold" />
          Add Category
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-[var(--surface-default)] rounded-xl border border-[var(--border-default)] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-[var(--text-secondary)] text-sm">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[var(--surface-bg)] flex items-center justify-center mb-3">
              <Tag size={24} className="text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">No categories found</h3>
            <p className="text-[13px] text-[var(--text-secondary)] mt-1">Get started by creating a new category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="responsive-records w-full text-left text-[13px]">
              <thead>
                <tr className="bg-[var(--surface-bg)] border-b border-[var(--border-default)]">
                  <th className="px-5 py-3 font-semibold text-[var(--text-secondary)] w-1/4">Category Name</th>
                  <th className="px-5 py-3 font-semibold text-[var(--text-secondary)] w-1/3">Description</th>
                  <th className="px-5 py-3 font-semibold text-[var(--text-secondary)] flex-1">AI Routing Keywords</th>
                  <th className="px-5 py-3 font-semibold text-[var(--text-secondary)] w-[120px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[var(--surface-bg)] transition-colors group">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[var(--text-primary)]">{cat.name}</p>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-secondary)] truncate max-w-[200px]" title={cat.description}>
                      {cat.description || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {cat.aiRoutingKeywords ? (
                        <div className="flex items-start gap-1.5">
                          <Robot size={15} className="text-indigo-400 shrink-0 mt-0.5" />
                          <p className="text-[var(--text-secondary)] truncate max-w-[250px]" title={cat.aiRoutingKeywords}>
                            {cat.aiRoutingKeywords}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[var(--text-tertiary)] italic">None</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors"
                          title="Edit"
                        >
                          <PencilSimple size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-subtle)] transition-colors"
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

      {isModalOpen && <CategoryModal
        isOpen={isModalOpen}
        initialData={editingCategory}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
      />}
    </div>
  );
}
