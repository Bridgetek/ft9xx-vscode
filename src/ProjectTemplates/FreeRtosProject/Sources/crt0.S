/**
  @file
  @brief    CRT0 for FT32 MCU FreeRTOS Port.
  @version  1.0
  @date     02-Sep-15
*/
/*
 * =============================================================================
 * Copyright (C) Bridgetek Pte Ltd
 * =============================================================================
 *
 * This source code ("the Software") is provided by Bridgetek Pte Ltd
 * ("Bridgetek") subject to the licence terms set out
 * http://brtchip.com/BRTSourceCodeLicenseAgreement/ ("the Licence Terms").
 * You must read the Licence Terms before downloading or using the Software.
 * By installing or using the Software you agree to the Licence Terms. If you
 * do not agree to the Licence Terms then do not download or use the Software.
 *
 * Without prejudice to the Licence Terms, here is a summary of some of the key
 * terms of the Licence Terms (and in the event of any conflict between this
 * summary and the Licence Terms then the text of the Licence Terms will
 * prevail).
 *
 * The Software is provided "as is".
 * There are no warranties (or similar) in relation to the quality of the
 * Software. You use it at your own risk.
 * The Software should not be used in, or for, any medical device, system or
 * appliance. There are exclusions of Bridgetek liability for certain types of loss
 * such as: special loss or damage; incidental loss or damage; indirect or
 * consequential loss or damage; loss of income; loss of business; loss of
 * profits; loss of revenue; loss of contracts; business interruption; loss of
 * the use of money or anticipated savings; loss of information; loss of
 * opportunity; loss of goodwill or reputation; and/or loss of, damage to or
 * corruption of data.
 * There is a monetary cap on Bridgetek's liability.
 * The Software may have subsequently been amended by another user and then
 * distributed by that other user ("Adapted Software").  If so that user may
 * have additional licence terms that apply to those amendments. However, Bridgetek
 * has no liability in relation to those amendments.
 * =============================================================================
 * Modification History
 * v1.0 @ 02-Sep-15
 * 1. Creation.
 */
        .equ EXITEXIT    , 0x1fffc

.section .crt0
.global _start
_start:
# START Interrupt Vector Table [[
        jmp     __PMSIZE-4         # RESET Vector
        jmp     interrupt_33       # Watchdog reset vector
        jmp     interrupt_0
        jmp     interrupt_1
        jmp     interrupt_2
        jmp     interrupt_3
        jmp     interrupt_4
        jmp     interrupt_5
        jmp     interrupt_6
        jmp     interrupt_7
        jmp     interrupt_8
        jmp     interrupt_9
        jmp     interrupt_10
        jmp     interrupt_11
        jmp     interrupt_12
        jmp     interrupt_13
        jmp     interrupt_14
        jmp     interrupt_15
        jmp     interrupt_16
        jmp     interrupt_17
        jmp     interrupt_18
        jmp     interrupt_19
        jmp     interrupt_20
        jmp     interrupt_21
        jmp     interrupt_22
        jmp     interrupt_23
        jmp     interrupt_24
        jmp     interrupt_25
        jmp     interrupt_26
        jmp     interrupt_27
        jmp     interrupt_28
        jmp     interrupt_29
        jmp     interrupt_30
        jmp     interrupt_31
        jmp     __PMSIZE-8         # Interrupt vector 32 (NMI)
# ]] END Interrupt Vector Table

codestart:
        jmp    init

.global _exithook
_exithook:                         # Debugger uses '_exithook' at 0x90 to catch program exit
        return

init:
        ldk     $sp,__RAMSIZE
        # Disable all interrupts
        lda     $r1,0x10000
        lshr    $r1,$r1,20
        cmp     $r1,0x90
        ldk     $r1,0x100e3     # FT900 IRQ Control Register
        jmpc    z,1f
        ldk     $r1,0x10123     # FT930 IRQ Control Register
1:
        ldk     $r4,0x80
        sti.b   $r1,0,$r4

        # Initialize DATA by copying from program memory
        ldk.l   $r4,__data_load_start
        ldk.l   $r1,__data_load_end
        ldk.l   $r2,0           # Will use __data after binutils patch

        jmp     .dscopy

.dsloop:
        # Copy PM[$r4] to RAM $r2
        lpmi.l  $r3,$r4,0
        sti.l   $r2,0,$r3
        add.l   $r4,$r4,4
        add.l   $r2,$r2,4

.dscopy:
        cmp.l   $r4,$r1
        jmpc    lt,.dsloop

        # Zero BSS
        ldk.l   $r4,_bss_start
        ldk.l   $r2,_end
        sub.l   $r2,$r2,$r4
        ldk.l   $r1,0
        ldk     $r3,32764
1:
        cmp     $r2,$r3
        jmpc    lt,2f
        memset  $r4,$r1,$r3
        add     $r4,$r4,$r3
        sub     $r2,$r2,$r3
        jmp     1b
2:
        memset  $r4,$r1,$r2
        # sub.l   $sp,$sp,24  # Space for the caller argument frame
        # jmp     _init
        jmp     main

.equ EXITEXIT, 0x1fffc

.global _exit
_exit:
        sta.l   EXITEXIT,$r0    # simulator end of test
        jmp     _exithook

        # Default function for watchdog handler
.global     _watchdog_default_isr
_watchdog_default_isr:
        # Clear watchdog interrupt pending flag
        lda     $r1,0x10000   # Read CHIP ID from location 0x10000
        lshr    $r1,$r1,20
        cmp     $r1,0x90
        lda.b   $r1,0x10342   # FT900 TIMER CONTROL 2 Register
        ldk     $r2,0x10342
        jmpc    z,1f
        lda.b   $r1,0x10562   # FT930 TIMER CONTROL 2 Register
        ldk     $r2,0x10562
1:
        ldk     $r4,0x04
        or      $r1,$r1,$r4   # clear watchdog interrupt pending flag
        sti.b   $r2,0,$r1
        # Read CHIP ID from location 0x10000
        lda.l   $r1,0x10000
        ldk     $r2,0xF000
        ashl    $r2,$r2,4
        # OR it with 0xF0000
        or      $r1,$r1,$r2
        ldk     $r3,0x90F0
        ashl    $r3,$r3,12
        or      $r3,$r3,1
        # check CHIP ID for FT900 rev B (else is FT900 rev C or FT930)
        # chip reboot in case of rev B
        cmp     $r1, $r3
        jmpc    nz,.ft900_rev_c
        call    _default_chip_reboot

.ft900_rev_c:
        nop
        nop
        nop
        # keep looping until second level timeout, in case of FT900 rev C or FT930
        jmp     .ft900_rev_c
        reti

# Chip reboot function
# Performs data transfer command from Data Memory to Flash Memory
#     at the end of the process the system gets reboot.
#     Refer command CMDDBG2F3 in AN_324 FT900 User Manual.
_default_chip_reboot:
        # wait in a loop and acquire debugger
        ldk.l   $r3,100000
        jmp     .loop_decr

.check_dbgr_avail:
        ldk.l   $r1,0x1080B
        ldi.b   $r1,$r1,0
        and.l   $r1,$r1,255
        cmp.l   $r1,0
        jmpc    z,.acquired_dbgr

.loop_decr:
        sub.l   $r3,$r3,1
        cmp.l   $r3,0
        jmpc    nz,.check_dbgr_avail
        jmp     .check_dbg_stat_ready

.acquired_dbgr:
        nop

.check_dbg_stat_ready:
        nop
        ldk.l   $r1,0x1080D
        ldi.b   $r1,$r1,0
        and.l   $r1,$r1,0x40         # debugger Status register : control busy is 0 when ready
        cmp.l   $r1,0
        jmpc nz,.check_dbg_stat_ready

.init_transfer:
        # setup ram start address
        ldk.l   $r1,0x10800
        ldk.b   $r2,0
        sti.b   $r1,0,$r2
        ldk.l   $r1,0x10801
        ldk.b   $r2,0
        sti.b   $r1,0,$r2
        ldk.l   $r1,0x10802
        ldk.b   $r2,0
        sti.b   $r1,0,$r2

        # setup flash start address
        ldk.l   $r1,0x10803
        ldk.b   $r2,0
        sti.b   $r1,0,$r2
        ldk.l   $r1,0x10804
        ldk.b   $r2,0
        sti.b   $r1,0,$r2
        ldk.l   $r1,0x10805
        ldk.b   $r2,0
        sti.b   $r1,0,$r2

        # setup length
        ldk.l   $r1,0x10806
        ldk.b   $r2,-1
        sti.b   $r1,0,$r2
        ldk.l   $r1,0x10807
        ldk.b   $r2,0
        sti.b   $r1,0,$r2
        ldk.l   $r1,0x10808
        ldk.b   $r2,0
        sti.b   $r1,0,$r2

        # setup write command
        ldk.l   $r1,0x10809
        ldk.b   $r2,6
        sti.b   $r1,0,$r2
        nop

.check_dbgr_done_0:
        ldk.l   $r1,0x1080D
        ldi.b   $r1,$r1,0
        and.l   $r1,$r1,0x40              # debugger Status register : control busy is 0 when ready
        cmp.l   $r1,0
        jmpc    nz,.check_dbgr_done_0

.initiate_transfer:
        # initiate transfer

        ldk.l $r1,0x10809
        ldk.b $r2,-2
        sti.b $r1,0,$r2
        nop

.check_dbgr_done_1:
        ldk.l $r1,0x1080D
        ldi.b $r1,$r1,0
        and.l $r1,$r1,0x40                # debugger Status register : control busy is 0 when ready
        cmp.l $r1,0
        jmpc nz,.check_dbgr_done_1

        # release_debugger
        ldk.l $r1,0x1080B
        ldk.b $r2,1
        sti.b $r1,0,$r2

        ldk.l $r1,0
        return

# Macro to construct the interrupt stub code.
# it just saves r0, loads r0 with the int vector
# and branches to interrupt_common.

.macro  inth i=0
interrupt_\i:
        push    $cc     # { See portasm.S for reason why $cc is saved first
        push    $r0     # {
        lda     $r0,(vector_table + 4 * \i)
        jmp     interrupt_common
.endm

        inth    0
        inth    1
        inth    2
        inth    3
        inth    4
        inth    5
        inth    6
        inth    7
        inth    8
        inth    9
        inth    10
        inth    11
        inth    12
        inth    13
        inth    14
        inth    15
        inth    16
        inth    17
        inth    18
        inth    19
        inth    20
        inth    21
        inth    22
        inth    23
        inth    24
        inth    25
        inth    26
        inth    27
        inth    28
        inth    29
        inth    30
        inth    31
        inth    32
        inth    33

# On entry: $cc and $r0 already saved; $r0 holds the handler function
interrupt_common:
        push    $r1     # {
        push    $r2     # {
        push    $r3     # {
        push    $r4     # {
        push    $r5     # {
        push    $r6     # {
        push    $r7     # {
        push    $r8     # {
        push    $r9     # {
        push    $r10    # {
        push    $r11    # {
        push    $r12    # {
        push    $r13    # {

# See tasks.c
.extern pxCurrentTCB
        # Save current context pointer.
        lda.l   $r13, pxCurrentTCB

        # We use system specific stack for ISR.
        # This stack is located at the top-most of memory map.
        # This region is unused once FreeRTOS scheduler starts.
        # This way, we can also reduce the stack size of each task.
        ### NOTE: with delayed push/pop code, we cannot do this here w/o
        ###         additional instructions (pre-calculate actual sp, store it, restore it.)
        #ldk.l   $sp, 0

.extern IsInISR
        # Set ISR Active flag
        ldk.l   $r1, 0x1122
        sta.l   IsInISR, $r1

        # Call IRQ handler
        calli   $r0

        # Clear ISR Active flag
        ldk.l   $r0, 0x3344
        sta.l   IsInISR, $r0

        # load new context pointer.
        lda.l   $r0, pxCurrentTCB

        # check if different
        cmp.l   $r0,$r13
        jmpc    z,exit_isr

        # Context has changed, continue pushing remaining registers.
        push    $r14    # {
        push    $r15    # {
        push    $r16    # {
        push    $r17    # {
        push    $r18    # {
        push    $r19    # {
        push    $r20    # {
        push    $r21    # {
        push    $r22    # {
        push    $r23    # {
        push    $r24    # {
        push    $r25    # {
        push    $r26    # {
        push    $r27    # {
        push    $r28    # {
        push    $r29    # {

        # save interrupt context.
        # call    vPortGetInterrupts
#ifdef __FT930__
        lda.b   $r1,0x10123
#else
        lda.b   $r1,0x100e3
#endif
        push.l  $r1

        # Save stack to prev context
        sti.l   $r13, 0, $sp

        # Restore stack from new context.
        ldi.l   $sp, $r0, 0


        # Restore interrupt context
        pop.l   $r0
        call    vPortSetInterrupts

        # finish poping registers for context switch.
        pop     $r29    # }
        pop     $r28    # }
        pop     $r27    # }
        pop     $r26    # }
        pop     $r25    # }
        pop     $r24    # }
        pop     $r23    # }
        pop     $r22    # }
        pop     $r21    # }
        pop     $r20    # }
        pop     $r19    # }
        pop     $r18    # }
        pop     $r17    # }
        pop     $r16    # }
        pop     $r15    # }
        pop     $r14    # }

exit_isr:
        # finish polling registers always pushed
        pop     $r13    # }
        pop     $r12    # }
        pop     $r11    # }
        pop     $r10    # }
        pop     $r9     # }
        pop     $r8     # }
        pop     $r7     # }
        pop     $r6     # }
        pop     $r5     # }
        pop     $r4     # }
        pop     $r3     # }
        pop     $r2     # }
        pop     $r1     # }
        pop     $r0     # }
        pop     $cc     # } matching push in interrupt_0-33 above
        reti

######################################
# End-of-Context-Switching Operation
######################################

# Null function for unassigned interrupt to point at
.global     nullvector
nullvector:
        return

.section .data
.global vector_table
        .align (4)                      # assembler alignment is in the power of 2 (in this case 2^4)
vector_table:
        .rept   33
        .long   nullvector
        .endr
        .long   _watchdog_default_isr

.section .text
.global __gxx_personality_sj0
__gxx_personality_sj0:
