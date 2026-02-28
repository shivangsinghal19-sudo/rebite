import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://prlbenrpgujqbdsdedxz.supabase.co'
const supabaseKey = 'sb_publishable_8s_rzdF1DPk0YF7NTnuG-w_63MWeYBb'

export const supabase = createClient(supabaseUrl, supabaseKey)