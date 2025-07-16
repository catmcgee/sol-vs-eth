use anchor_lang::prelude::*;

declare_id!("Cnt1111111111111111111111111111111111111111");  

#[program]
pub mod counter_anchor {
    use super::*;

    /// Creates the Counter account with count = 0.                    
    pub fn initialize_counter(_ctx: Context<InitializeCounter>) -> Result<()> {  // @id:init_fn
        Ok(())
    }

    /// Loads the account and adds 1 to `count`.                         
    pub fn increment(ctx: Context<Increment>) -> Result<()> {            // @id:increment_fn
        ctx.accounts.counter.count =                                    // @id:increment_write @explain: Solana contracts do not do overflow checking by default (like Solidity v.0.8.0+) so we do it here
            ctx.accounts.counter.count.checked_add(1).unwrap();         // @id:increment_write @explain: Solana contracts do not do overflow checking by default (like Solidity v.0.8.0+) so we do it here
        Ok(())
    }
}

#[derive(Accounts)]                                                     // @id:derive_accounts_initialize @explain:Generates Anchor account validation/deser impl for InitializeCounter
pub struct InitializeCounter<'info> {                                   // @id:initialize_ctx @explain:Accounts context required by the initialize instruction; 'info ties lifetimes to invocation

    #[account(mut)]                                                     // @id:payer_mut @explain: mut=mutable because the account's data may change (pays rent & debit for new account)
    pub payer: Signer<'info>,                                           // @id:payer_signer @explain:Transaction signer funding creation; must sign to debit lamports (similar to gas)

    #[account(                                                          // @id:counter_attr_block @explain:Constraints describing how to create/validate the counter account
        init,                                                           // @id:counter_init @explain:Create the account if it does not yet exist, assign to this program
        space = 8 + Counter::INIT_SPACE,                                // @id:counter_space @explain:On Solana you pre-allocate account bytes (affects rent) - Anchor adds 8B discriminator header
        payer = payer                                                   // @id:counter_payer @explain:Use `payer` account's lamports to fund rent
    )]
    pub counter: Account<'info, Counter>,                               // @id:counter_pda @explain:Program-owned data account storing the global counter state

    pub system_program: Program<'info, System>,                         // @id:system_program @explain:Built-in program that actually creates/allocates accounts & transfers lamports
}

#[derive(Accounts)]                                                     // @id:derive_accounts_increment @explain:Generates validation impl for Increment context
pub struct Increment<'info> {                                          

    #[account(mut)]                                                     // @id:counter_mut_attr @explain: Mutable so the counter can be changed
    pub counter: Account<'info, Counter>,                               // @id:counter_mut @explain:Existing counter account to load, modify, and serialize back
}

#[account]                                                            
#[derive(InitSpace)]                                                    // @id:counter_initspace @explain: InitSpace macro generates an associated constant INIT_SPACE on Counter that equals the number of bytes needed to serialize just the fields of the struct (no discriminator). u64 = 8 bytes, so Counter::INIT_SPACE = 8
pub struct Counter {                                                    // @id:counter_struct @explain:Onchain data layout for global counter
    pub count: u64,                                                     // @id:count_field @explain:Persistent counter value, same as Solidity uint
}
