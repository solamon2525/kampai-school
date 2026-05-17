/**
 * meal-budget.service.ts
 * อุดหนุนอาหารกลางวัน/นม รายเด็ก ต่อภาคเรียน
 */
import { supabase } from '@/integrations/supabase/client';

export type MealPeriod = 'ภาคเรียน 1' | 'ภาคเรียน 2' | 'รวมปี';

export type MealBudgetRow = {
    id: string;
    student_id: string;
    academic_year: number;
    period: MealPeriod;
    meal_subsidy: number;
    milk_subsidy: number;
    notes: string | null;
    recorded_at: string;
};

export const mealBudgetService = {
    listByStudent: async (studentId: string) => {
        const { data, error } = await supabase
            .from('student_meal_budget' as never)
            .select('*')
            .eq('student_id', studentId)
            .order('academic_year', { ascending: false })
            .order('period', { ascending: true });
        return { data: data as MealBudgetRow[] | null, error };
    },

    listByYear: async (academicYear: number) => {
        const { data, error } = await supabase
            .from('student_meal_budget' as never)
            .select('*, student:student_id(id, first_name, last_name, photo_url, classroom)')
            .eq('academic_year', academicYear)
            .order('recorded_at', { ascending: false });
        return { data, error };
    },

    upsert: async (row: Omit<MealBudgetRow, 'id' | 'recorded_at'>) => {
        const { data: user } = await supabase.auth.getUser();
        return supabase
            .from('student_meal_budget' as never)
            .upsert(
                { ...row, recorded_by: user.user?.id ?? null } as never,
                { onConflict: 'student_id,academic_year,period' } as never,
            )
            .select()
            .single();
    },

    remove: async (id: string) =>
        supabase.from('student_meal_budget' as never).delete().eq('id', id),
};
