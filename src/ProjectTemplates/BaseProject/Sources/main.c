/**
  @file main.c
  @brief
  Empty source file for a new FT90x project.

 */
/*
 * ============================================================================
 * (C) Copyright Bridgetek Pte Ltd
 * ============================================================================
 *
 * This source code ("the Software") is provided by Bridgetek Pte Ltd
 *  ("Bridgetek ") subject to the licence terms set out
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
 * ============================================================================
 */

#include <ft900.h>
#include <stdint.h>

#if defined(__FT900__)
#define GPIO_UART0_TX 48
#define GPIO_UART0_RX 49
#elif defined(__FT930__)
#define GPIO_UART0_TX 23
#define GPIO_UART0_RX 22
#endif

int main(void)
{
  /* Enable the UART Device... */
  sys_enable(sys_device_uart0);
  /* Set UART0 GPIO functions to UART0_TXD and UART0_RXD... */
  gpio_function(GPIO_UART0_TX, pad_uart0_txd); /* UART0 TXD */
  gpio_function(GPIO_UART0_RX, pad_uart0_rxd); /* UART0 RXD */
  uart_open(UART0,                             /* Device */
            1,                                 /* Prescaler = 1 */
            UART_DIVIDER_19200_BAUD,           /* Divider = 1302 */
            uart_data_bits_8,                  /* No. Data Bits */
            uart_parity_none,                  /* Parity */
            uart_stop_bits_1);                 /* No. Stop Bits */

  /* Print out a welcome message... */
  uart_puts(UART0,
            "--------------------------------------------------------------------- \r\n"
            "Hello World! \r\n"
            "--------------------------------------------------------------------- \r\n");
  /* Now keep looping */
  while (1)
  {
    // Do nothing
  }


  return 0;
}
