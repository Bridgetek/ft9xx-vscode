/**
  @file template.c
  @brief Template file for demonstrating using Visual Studio Code with FT9xx
 */
/*
 * ============================================================================
 * History
 * =======
 *  13 Jan 2022 : Created
 *
 * (C) Copyright, Bridgetek Pte Ltd
 * ============================================================================
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
 * corruption of buffer.
 * There is a monetary cap on Bridgetek's liability.
 * The Software may have subsequently been amended by another user and then
 * distributed by that other user ("Adapted Software").  If so that user may
 * have additional licence terms that apply to those amendments. However, Bridgetek
 * has no liability in relation to those amendments.
 * ============================================================================
 */

/* INCLUDES ************************************************************************/

#include <stdint.h>
#include <string.h>
#include <ctype.h>
#include <stdlib.h>

#include <ft900.h>

/* UART support for printf output. */
#include "tinyprintf.h"

/* For MikroC const qualifier will place variables in Flash
 * not just make them constant.
 */
#if defined(__GNUC__)
#define DESCRIPTOR_QUALIFIER const
#elif defined(__MIKROC_PRO_FOR_FT90x__)
#define DESCRIPTOR_QUALIFIER data
#endif

/* CONSTANTS ***********************************************************************/

/* For UART ring buffer. */
#define RINGBUFFER_SIZE 128
#define USBD_ep_size_bytes(x)		(8 << (x))

/* GLOBAL VARIABLES ****************************************************************/

/* LOCAL VARIABLES *****************************************************************/

/**
 @name Millisecond counter
 @brief Count of milliseconds updated by timer.
 */
volatile uint32_t mscounter = 0;

/**
 @name UART ring buffer variables.
 @brief Variables required to implement an Rx ring buffer for the UART.
 */
//@{
static uint8_t uart0BufferIn_data[RINGBUFFER_SIZE];
static volatile uint16_t uart0BufferIn_wr_idx = 0;
static volatile uint16_t uart0BufferIn_rd_idx = 0;
static volatile uint16_t uart0BufferIn_avail = RINGBUFFER_SIZE;
//@}

/* MACROS **************************************************************************/

/* LOCAL FUNCTIONS / INLINES *******************************************************/

/** @name tfp_putc
 *  @details Machine dependent putc function for tfp_printf (tinyprintf) library.
 *  @param p Parameters (machine dependent)
 *  @param c The character to write
 */
void tfp_putc(void* p, char c)
{
	uart_write((ft900_uart_regs_t*)p, (uint8_t)c);
}

/** @name ISR_timer
 *  @details Handle interrupts from the timer.
 */
void ISR_timer(void)
{
	if (timer_is_interrupted(timer_select_a))
	{
		mscounter++;
	}
}

/** @name my_getc
 *  @details Machine dependent getc function for.
 *  @param p Parameters (machine dependent)
 *  @param c The character to read.
 */
int8_t my_getc(char *c)
{
	int8_t copied = -1;

	CRITICAL_SECTION_BEGIN
	if (uart0BufferIn_avail < RINGBUFFER_SIZE)
	{
		uart0BufferIn_avail++;

		*c = uart0BufferIn_data[uart0BufferIn_rd_idx];

		/* Increment the pointer and wrap around */
		uart0BufferIn_rd_idx++;
		if (uart0BufferIn_rd_idx == RINGBUFFER_SIZE) uart0BufferIn_rd_idx = 0;

		copied = 0;
	}
	CRITICAL_SECTION_END

    /* Report back how many bytes have been copied into the buffer...*/
    return copied;
}

/**
 The Interrupt that allows echoing back over UART0
 */
/**
 The Interrupt which handles asynchronous transmission and reception
 of data into the ring buffer
 */
void uart0ISR(void)
{
    static uint8_t c;

    /* Receive interrupt... */
    if (uart_is_interrupted(UART0, uart_interrupt_rx))
    {
        /* Read a byte into the Ring Buffer... */
        uart_read(UART0, &c);

        // Do not overwrite data already in the buffer.
        if (uart0BufferIn_avail > 0)
        {
        	uart0BufferIn_avail--;

        	uart0BufferIn_data[uart0BufferIn_wr_idx] = c;

			/* Increment the pointer and wrap around */
			uart0BufferIn_wr_idx++;
			if (uart0BufferIn_wr_idx == RINGBUFFER_SIZE) uart0BufferIn_wr_idx = 0;
        }
    }
}

/**
 @brief      USB suspend callback
 @details    Called when the USB bus enters the suspend state.
 @param[in]	status - unused.
 @return		N/A
 **/
void suspend_cb(uint8_t status)
{
	(void) status;
	return;
}

/**
 @brief      USB resume callback
 @details    Called when the USB bus enters the resume state
 prior to restating after a suspend.
 @param[in]  status - unused.
 @return     N/S
 **/
void resume_cb(uint8_t status)
{
	(void) status;
	return;
}

/**
 @brief      USB reset callback
 @details    Called when the USB bus enters the reset state.
 @param[in]	status - unused.
 @return		N/A
 **/
void reset_cb(uint8_t status)
{
	(void) status;

	USBD_set_state(USBD_STATE_DEFAULT);

	// If we are at DFUSTATE_MANIFEST_WAIT_RESET stage and do
	// not support detach then the DFU will reset the chip and
	// run the new firmware.
	// From the DFUSTATE_APPIDLE state advance to DFUSTATE_DFUIDLE.
	// Other states will not advance the state machine or may
	// move this to DFUSTATE_DFUERROR if it is inappropriate to
	// find a reset at that stage.
	USBD_DFU_reset();

	return;
}

/* Handle common power management events. */
void powermanagement_ISR(void)
{
	if (SYS->PMCFG_H & MASK_SYS_PMCFG_DEV_CONN_DEV)
	{
		// Clear connection interrupt
		SYS->PMCFG_H = MASK_SYS_PMCFG_DEV_CONN_DEV;
		USBD_attach();
	}

	if (SYS->PMCFG_H & MASK_SYS_PMCFG_DEV_DIS_DEV)
	{
		// Clear disconnection interrupt
		SYS->PMCFG_H = MASK_SYS_PMCFG_DEV_DIS_DEV;
		USBD_detach();
	}

	if (SYS->PMCFG_H & MASK_SYS_PMCFG_HOST_RST_DEV)
	{
		// Clear Host Reset interrupt
		SYS->PMCFG_H = MASK_SYS_PMCFG_HOST_RST_DEV;
		USBD_resume();
	}

	if (SYS->PMCFG_H & MASK_SYS_PMCFG_HOST_RESUME_DEV)
	{
		// Clear Host Resume interrupt
		SYS->PMCFG_H = MASK_SYS_PMCFG_HOST_RESUME_DEV;
		if(! (SYS->MSC0CFG & MASK_SYS_MSC0CFG_DEV_RMWAKEUP))
		{
			// If we are driving K-state on Device USB port;
			// We must maintain the 1ms requirement before resuming the phy
			USBD_resume();
		}
	}
}

/* FUNCTIONS ***********************************************************************/

int main(void)
{
	sys_reset_all();
	/* Enable the UART Device... */
	sys_enable(sys_device_uart0);
#if defined(__FT930__)
    /* Make GPIO23 function as UART0_TXD and GPIO22 function as UART0_RXD... */
    gpio_function(23, pad_uart0_txd); /* UART0 TXD */
    gpio_function(22, pad_uart0_rxd); /* UART0 RXD */
#else
	/* Make GPIO48 function as UART0_TXD and GPIO49 function as UART0_RXD... */
	gpio_function(48, pad_uart0_txd); /* UART0 TXD */
	gpio_function(49, pad_uart0_rxd); /* UART0 RXD */
#endif
	uart_open(UART0,                    /* Device */
			1,                        /* Prescaler = 1 */
            UART_DIVIDER_19200_BAUD,  /* Divider = 1302 */
			uart_data_bits_8,         /* No. Data Bits */
			uart_parity_none,         /* Parity */
			uart_stop_bits_1);        /* No. Stop Bits */

	/* Print out a welcome message... */
	uart_puts(UART0,
			"\x1B[2J" /* ANSI/VT100 - Clear the Screen */
			"\x1B[H"  /* ANSI/VT100 - Move Cursor to Home */
	);

	/* Enable tfp_printf() functionality... */
	init_printf(UART0, tfp_putc);

	sys_enable(sys_device_timer_wdt);

	/* Timer A = 1ms */
	timer_prescaler(timer_select_a, 1000);
	timer_init(timer_select_a, 100, timer_direction_down, timer_prescaler_select_on, timer_mode_continuous);
	timer_enable_interrupt(timer_select_a);
	timer_start(timer_select_a);
	interrupt_attach(interrupt_timers, (int8_t)interrupt_timers, ISR_timer);

	interrupt_attach(interrupt_0, (int8_t)interrupt_0, powermanagement_ISR);
	tfp_printf("(C) Copyright, Bridgetek Pte Ltd \r\n");
	tfp_printf("--------------------------------------------------------------------- \r\n");
	tfp_printf("Welcome to the FT9xx built and debugged using Visual Studio Code. \r\n");
	tfp_printf("--------------------------------------------------------------------- \r\n");

	/* Attach the interrupt so it can be called... */
	interrupt_attach(interrupt_uart0, (uint8_t) interrupt_uart0, uart0ISR);
	uart_disable_interrupt(UART0, uart_interrupt_tx);
	/* Enable the UART to fire interrupts when receiving buffer... */
	uart_enable_interrupt(UART0, uart_interrupt_rx);
	/* Enable interrupts to be fired... */
	uart_enable_interrupts_globally(UART0);

	interrupt_enable_globally();
	
	/* Perform tasks required for this application . */

	interrupt_detach(interrupt_timers);
	interrupt_disable_globally();

	sys_disable(sys_device_timer_wdt);

	// Wait forever...
	for (;;);
	return 0;
}

