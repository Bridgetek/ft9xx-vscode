# Define the filename of the output.
# By default this is based on the current directory name.
# If specifying a project name with special characters then use escape sequences:
# e.g. PROJECT="Project\ with\ spaces"
PROJECT ?= $(subst  $(null) $(null),\ ,$(notdir $(patsubst %/,%,$(CURDIR))))

# Get the configuration of the build from the command line.
# This can be of the forms:
# make CONFIG=FT90x_Debug
# make TARGET=FT90x BUILD=Debug
ifneq ($(CONFIG),"")
# Target by default this is FT90x.
TARGET ?= $(word 1,$(subst _, ,$(CONFIG)))
# By default this is FT90x.
BUILD ?= $(word 2,$(subst _, ,$(CONFIG)))
endif

# Check the configuration from the command line.
ifneq ($(TARGET),FT90x)
ifneq ($(TARGET),FT93x)
$(error Please choose TARGET=FT90x or TARGET=FT93x, not $(TARGET))
endif
endif
ifneq ($(BUILD),Debug)
ifneq ($(BUILD),Release)
$(error Please choose BUILD=Debug or BUILD=Release, not $(BUILD))
endif
endif

# Local include directories.
INC_DIRS :=	./include

# Local source directories.
SRC_DIRS :=	. \
			src \
			ld

# Add optional flags for included libraies.
USE_FREERTOS_CRT0 := false

# Advanced settings below this point.

# Identify known included libraries.
USE_FREERTOS := $(wildcard lib/FreeRTOS/.)
USE_TINYPRINTF := $(wildcard lib/tinyprintf/.)

# Platform determination - discriminate between Windows and other types.
ifeq ($(OS),Windows_NT)
    DETECTED_OS := Windows
	MKDIR := gmkdir
else
    DETECTED_OS := $(shell uname)  # same as "uname -s"
	MKDIR := mkdir
endif

# FT900 hardware support library path (immediate).
ifeq ($(DETECTED_OS),Windows)
	ifeq ($(BUILD),Debug)
		LNLIBS := -L"$(FT9XX_TOOLCHAIN)/hardware/lib/Debug"
	else
		LNLIBS := -L"$(FT9XX_TOOLCHAIN)/hardware/lib/Release"
	endif
endif

# Compiler Debugger Flags (immediate).
CPPFLAGS := $(CPPFLAGS)
ifeq ($(BUILD),Debug)
	CPPFLAGS := -Og -g
else
	CPPFLAGS := 
endif

# Hardware Makefile definitions.
CPP := "$(FT9XX_COMPILER)/bin/ft32-elf-gcc"
CXX := "$(FT9XX_COMPILER)/bin/ft32-elf-g++"
AS := "$(FT9XX_COMPILER)/bin/ft32-elf-as"
LN := "$(FT9XX_COMPILER)/bin/ft32-elf-ln"
OBJCOPY := "$(FT9XX_COMPILER)/bin/ft32-elf-objcopy"
SIZE := "$(FT9XX_COMPILER)/bin/ft32-elf-size"

# Ensure that SRCS variable is never expanded on use (immediate).
# Add local assembler files (.S) to list of sources.
SRCS := $(foreach dir,$(SRC_DIRS),$(wildcard $(dir)/*.S))
# Add local C files (.c) to list of sources.
SRCS += $(foreach dir,$(SRC_DIRS),$(wildcard $(dir)/*.c))

# Required device type macro definitions.
ifeq (($TARGET), FT90x)
	CPPFLAGS += -D__FT900__ 
	ASFLAGS += --defsym __FT900__=1
else
	CPPFLAGS += -D__FT930__ -mft32b -mcompress
	ASFLAGS += --defsym __FT930__=1
endif

# Set standard compiler flags for FT9xx compilations.
CPPFLAGS += -fvar-tracking -fvar-tracking-assignments -fmessage-length=0 -ffunction-sections
# Add in hardware support library include path.
CPPFLAGS += -I"$(FT9XX_TOOLCHAIN)/hardware/include"
# Turn on all warnings.
CPPFLAGS += -Wall 

# Set standard linker flags for FT900 compilations.
# To use a custom crt0 file add -nostartfiles to LNFLAGS
LNFLAGS := -Wl,--gc-sections -Wl,--entry=_start -Xlinker
# Find any linker scripts in the sources directory.
LNSCRIPTS := $(foreach dir,$(SRC_DIRS),$(wildcard $(dir)/*.ld))
# Add scripts to the linker settings.
LNFLAGS += $(foreach lds,$(LNSCRIPTS),-dT "$(lds)") 
# Add libraries required for builds.
ifeq (($TARGET), FT90x)
	LNLIBS += -lft900
else
	LNLIBS += -lft930
endif
LNLIBS += -lc -lstub

# FreeRTOS Makefile definitions.
ifneq ($(USE_FREERTOS),$(null))
# Use the builtin crt0.S from FreeRTOS by default.
# Add a line "USE_FREERTOS_CRT0 := false" to use a different crt0 source file.
	USE_FREERTOS_CRT0 ?= true
# Select heap type 4 to be used in FreeRTOS by default
# Add a line "USE_FREERTOS_HEAP := x" to use a specific heap implementation
	USE_FREERTOS_HEAP ?= 4
	ifeq ($(USE_FREERTOS_CRT0),true)
		FREERTOS_SRCDIRS := $(USE_FREERTOS)/Demo/FT32_GCC 
	endif
	FREERTOS_SRCDIRS += $(USE_FREERTOS)/Source/portable/GCC/FT32 \
						$(USE_FREERTOS)/Source/portable/MemMang \
						$(USE_FREERTOS)/Source/include \
						$(USE_FREERTOS)/Source
# Find *.c files in the FreeRTOS library and add to the source file list
	SRCS += $(foreach dir,$(FREERTOS_SRCDIRS),$(wildcard $(dir)/*.c))
# Add *.S files in the FreeRTOS library and add to the source file list
	SRCS += $(foreach dir,$(FREERTOS_SRCDIRS),$(wildcard $(dir)/*.S))
# If the builtin crt0.S is not used then add the search path back correctly
	ifneq ($(USE_FREERTOS_CRT0),true)
		FREERTOS_SRCDIRS := $(USE_FREERTOS)/Demo/FT32_GCC $(FREERTOS_SRCDIRS)
	endif
# Add FreeRTOS requirements to the compiler flags
	CPPFLAGS += -DFT32_PORT_HEAP=$(USE_FREERTOS_HEAP) # Use heap model
	CPPFLAGS += -DFT32_PORT # Use FT32 port
# Add FreeRTOS include paths to the compiler flags
	CPPFLAGS += $(foreach incs,$(FREERTOS_SRCDIRS),-I"$(incs)")
endif

# Tinyprintf Makefile definitions.
ifneq ($(USE_TINYPRINTF),$(null))
# Add tinyprintf files source file list
	SRCS += $(USE_TINYPRINTF)/tinyprintf.c
# Add tinyprintf include paths to the compiler flags
	CPPFLAGS += -I$(USE_TINYPRINTF)
endif

# Set build directory for output.
BUILD_DIR := $(TARGET)_$(BUILD)
# Set object file directory within build directory.
OBJDIR := $(BUILD_DIR)/obj

# Generate object file list for *.c files in source list.
OBJS     := $(patsubst %.c,$(OBJDIR)/%.o,$(SRCS))
# Generate object file list for *.S files in source list.
OBJS     := $(patsubst %.S,$(OBJDIR)/%.o,$(OBJS))
# Generate dependency list from object file list.
DEPS     := $(OBJS:.o=.d)
# Add include files for local include directories to flags.
CPPFLAGS += $(addprefix -I,$(INC_DIRS)) -Wall 

# PROJECTs
.PHONY: all clean

all: $(BUILD_DIR)/$(PROJECT).bin

# Generate Flash file (.bin) for programming.
$(BUILD_DIR)/$(PROJECT).bin: $(BUILD_DIR)/$(PROJECT).elf
	@echo 'Invoking: FT90x Flash File Generator'
	$(OBJCOPY) --output-target binary "$<" "$@"
	@echo 'Finished building: $<'
	@echo 'Invoking: FT90x Display Image Size'
	$(SIZE) --format=berkeley -x "$<"
	@echo 'Finsihed building: SIZE'

# Link object files into output program (.elf).
$(BUILD_DIR)/$(PROJECT).elf: $(OBJS)
	@echo 'Building project: $@'
	@echo 'Invoking: FT90x GCC Linker'
	$(CPP) $(LNFLAGS) $(OBJS) $(LNLIBS) -o "$@" 
	@echo 'Finished building: $@'

# Compile C source files (.c) into object files (.o).
$(OBJDIR)/%.o: %.c 
	@echo 'Building file: $<'
	@echo 'Invoking: FT90x GCC Compiler'
# Create a target directory for the object files.
	@$(MKDIR) -p $(dir $@)
# Perform compilation step.
	$(CPP) $(CPPFLAGS) -MMD -MP -MF"$(patsubst %.o,%.d,$@)" -MT"$@" -o "$@" -c "$<"
	@echo 'Finished building: $<'

# Compile assembler source files (.S) into object files (.o)
# Create a target directory for the object files
$(OBJDIR)/%.o: %.S 
	@echo 'Building file: $<'
	@echo 'Invoking: FT90x GCC Assembler'
# Create a target directory for the object files.
	@$(MKDIR) -p $(dir $@)
# Perform assembly step.
	$(AS) $(ASFLAGS) -o "$@" "$<"
	@echo 'Finished building: $<'

# Clean the output directory.
clean:
	@echo 'Cleaning directory: $(BUILD_DIR)'
ifeq ($(DETECTED_OS),Windows)
	@IF EXIST "$(subst /,\,$(BUILD_DIR))" RMDIR /S /Q "$(subst /,\,$(BUILD_DIR))"
else
	@$(RM) -r $(BUILD_DIR)
endif
	@echo 'Finished cleaning: $(BUILD_DIR)'

ifeq "$(MAKECMDGOALS)" ""
-include $(DEPS)
endif
