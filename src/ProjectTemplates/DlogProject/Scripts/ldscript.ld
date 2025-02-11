/* Default linker script, for normal executables */
OUTPUT_FORMAT("elf32-ft32")
OUTPUT_ARCH(ft32)
SEARCH_DIR("/data/win8/ft32/ft32-elf/lib");

/* Allow the command line to override the memory region sizes.  */
__PMSIZE = DEFINED(__PMSIZE)  ? __PMSIZE : DEFINED(__FT930__)? 128K : 256K;
__RAMSIZE = DEFINED(__RAMSIZE) ? __RAMSIZE : DEFINED(__FT930__)? 32K : 64K;
/* Allocate space reserved for bootloader */
__PROGMAX = __PMSIZE - 4K;

MEMORY
{
  flash     (rx)     : ORIGIN = 0,         LENGTH = __PROGMAX
  bootflash (rx)     : ORIGIN = __PROGMAX, LENGTH = 4K
  ram       (rw!x)   : ORIGIN = 0x800000,  LENGTH = __RAMSIZE
  peripherals (rw!x) : ORIGIN = 0x810000,  LENGTH = 0x1000
  ehci      (rw!x)   : ORIGIN = 0x811000,  LENGTH = 0x2000
}

SECTIONS
{
  .text :
  {
    *(.crt0*)
    *(.text*)
    *(.strings)
    *(._pm*)
    KEEP (*(SORT_NONE(.init)))
    KEEP (*(SORT_NONE(.fini)))
    _etext = .;
    . = ALIGN(4);
  } > flash

  .data :  AT (ADDR (.text) + SIZEOF (.text))
  {
    *(.data)
    *(.data*)
    *(.rodata)
    *(.rodata*)
    _edata = .;
    . = ALIGN(4);
  } > ram

  .tors :
  {
    ___ctors = . ;
    *(.ctors)
    ___ctors_end = . ;
    ___dtors = . ;
    *(.dtors)
    ___dtors_end = . ;
    . = ALIGN(4);
  } > ram

  .bss SIZEOF(.tors) + SIZEOF(.data) + ADDR(.data) :
  {
    _bss_start = . ;
    *(.bss)
    *(.bss*)
    *(COMMON)
    _end = . ;
    . = ALIGN(4);
  } > ram

  __data_load_start = LOADADDR(.data);
  __data_load_end = __data_load_start + SIZEOF(.data);

  /* Peripheral Register Blocks from 0x810000 to 0x810FFF */
  .peripheralsBlock (NOLOAD):
  {
    KEEP(*(.peripheralsSection))
  } > peripherals

  /* EHCI RAM - Accessed via aligned 32 bit reads and writes only. */
  .ehciBlock (NOLOAD):
  {
    KEEP(*(.ehciSection))
  } > ehci

  .stab 0 (NOLOAD) :
  {
    *(.stab)
  }

  .stabstr 0 (NOLOAD) :
  {
    *(.stabstr)
  }
}
