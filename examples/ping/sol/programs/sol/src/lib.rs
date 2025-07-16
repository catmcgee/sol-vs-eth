use anchor_lang::prelude::*; // @id:anchor_prelude @explain:Brings commonly used Anchor items into scope: Context, Accounts, Account, Program, Result alias, msg!, etc. Anchor is the most-used framework for building Solana programs in Rust

declare_id!("5MaYSEuAXu3q2djpsBgyNy1y4KLFqj7c6jvAYBUoyUc3"); // @id:program_id @explain:Declares the expected onchain program ID for this crate

#[program] // @id:program_def @explain:Anchor macro that marks this as containing program's instruction handlers.
pub mod ping {                               // @id:program_mod @explain:Rust module that groups instruction functions; the name is local (not the onchain address)
    use super::*;                            // @id:program_use @explain:Use items from the outer scope (ie Anchor prelude) into this module

    pub fn ping(_ctx: Context<PingCtx>) -> Result<()> {    // @id:ping_fn @explain:Instruction handler (exposed onchain)
                                                           // @id:ping_ctx @explain:Receives a typed account context (PingCtx)
        msg!("Pong from {:?}", _ctx.program_id);           // @id:pong_event @explain:Emit a log line to the Solana transaction log. Prints this program's Pubkey
        Ok(())                                             // @id:ping_ok @explain:Return success - Anchor converts this to the required Solana program return type
    }
}                                             

#[derive(Accounts)]                            // @id:ping_ctx_def @explain:Anchor macro: auto-generate account validation/deserialization for the struct below
pub struct PingCtx {}                          // @id:ping_ctx_empty @explain:Empty context = this instruction expects no custom accounts beyond the implicit program ID                               
