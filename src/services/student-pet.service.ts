import { supabase } from '@/integrations/supabase/client';

export type PetRarity = 'common' | 'rare' | 'epic';

export type StudentPetCatalogItem = {
  code: string;
  name_th: string;
  species_th: string;
  description: string;
  visual_key: string;
  rarity: PetRarity;
  price: number;
  owned: boolean;
  equipped: boolean;
  nickname: string | null;
  bond_xp: number;
};

export type EquippedStudentPet = Pick<
  StudentPetCatalogItem,
  'code' | 'name_th' | 'species_th' | 'visual_key' | 'rarity' | 'nickname' | 'bond_xp'
>;

export type StudentPetState = {
  student_id: string;
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  equipped: EquippedStudentPet | null;
  catalog: StudentPetCatalogItem[];
  action?: 'purchased' | 'equipped' | 'already_owned';
  pet_code?: string;
};

export const studentPetQueryKey = (studentCode: string) => ['student-pets', studentCode.trim()];

const callPetRpc = async (
  functionName: 'get_student_pet_state' | 'buy_student_pet' | 'equip_student_pet',
  args: Record<string, string>,
): Promise<StudentPetState> => {
  const { data, error } = await supabase.rpc(functionName as never, args as never);
  if (error) throw error;
  return data as unknown as StudentPetState;
};

export const studentPetService = {
  getState: (studentCode: string) =>
    callPetRpc('get_student_pet_state', { p_student_code: studentCode.trim() }),

  buy: (studentCode: string, petCode: string) =>
    callPetRpc('buy_student_pet', {
      p_student_code: studentCode.trim(),
      p_pet_code: petCode,
    }),

  equip: (studentCode: string, petCode: string) =>
    callPetRpc('equip_student_pet', {
      p_student_code: studentCode.trim(),
      p_pet_code: petCode,
    }),
};

