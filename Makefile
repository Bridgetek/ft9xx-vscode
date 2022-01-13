# Define the filename of the output target
# By default this is based on the current directory name
TARGET ?= $(subst  $(null) $(null),\ ,$(notdir $(patsubst %/,%,$(CURDIR))))
# Set the configuration - default to DEBUG - any other value makes a release build
CONFIG ?= DEBUG

# Local include directories
INC_DIRS :=	./include

# Local source directories
SRC_DIRS :=	. \
			src \
			ld

# Add optional flags for included libraies
USE_FREERTOS_CRT0 := false

# DO NOT MAKE CHANGES AFTER THIS POINT 

# Identify known included libraries
USE_FREERTOS := $(wildcard lib/FreeRTOS/.)
USE_TINYPRINTF := $(wildcard lib/tinyprintf/.)

# Platform determination - discriminate between Windows and other types
ifeq ($(OS),Windows_NT)
    DETECTED_OS := Windows
else
	DETECTED_OS := $(error Sorry Non-Windows platforms not supported yet.)
    #DETECTED_OS := $(shell uname)  # same as "uname -s"
endif

# FT900 hardware support library path (immediate)
ifeq ($(DETECTED_OS),Windows)
ifeq ($(CONFIG),DEBUG)
LNLIBS := -L"C:/Program Files (x86)/Bridgetek/FT9xx Toolchain/Toolchain/hardware/lib/Debug"
else
LNLIBS := -L"C:/Program Files (x86)/Bridgetek/FT9xx Toolchain/Toolchain/hardware/lib/Release"
endif
endif

# Compiler Debugger Flags (immediate)
CPPFLAGS := $(CPPFLAGS)
ifeq ($(CONFIG),DEBUG)
CPPFLAGS := -Og -g
else
CPPFLAGS := 
endif

# Hardware Makefile definitions
ifeq ($(DETECTED_OS),Windows)
CPP := "C:/Program Files (x86)/Bridgetek/FT9xx Toolchain/Toolchain/tools/bin/ft32-elf-gcc"
CXX := "C:/Program Files (x86)/Bridgetek/FT9xx Toolchain/Toolchain/tools/bin/ft32-elf-g++"
AS := "C:/Program Files (x86)/Bridgetek/FT9xx Toolchain/Toolchain/tools/bin/ft32-elf-as"
LN := "C:/Program Files (x86)/Bridgetek/FT9xx Toolchain/Toolchain/tools/bin/ft32-elf-ln"
OBJCOPY := "C:/Program Files (x86)/Bridgetek/FT9xx Toolchain/Toolchain/tools/bin/ft32-elf-objcopy"
SIZE := "C:/Program Files (x86)/Bridgetek/FT9xx Toolchain/Toolchain/tools/bin/ft32-elf-size"
endif

# Ensure that SRCS variable is never expanded on use (immediate)
# Add local assembler files (.S) to list of sources
SRCS := $(foreach dir,$(SRC_DIRS),$(wildcard $(dir)/*.S))
# Add local C files (.c) to list of sources
SRCS += $(foreach dir,$(SRC_DIRS),$(wildcard $(dir)/*.c))

# Required FT900 definitions
CPPFLAGS += -D__FT900__ -fvar-tracking -fvar-tracking-assignments -fmessage-length=0 -ffunction-sections
ifeq ($(DETECTED_OS),Windows)
# Add in hardware support library include path
CPPFLAGS += -I"C:/Program Files (x86)/Bridgetek/FT9xx Toolchain/Toolchain/hardware/include"
endif
# Set standard compiler flags for FT900 compilations
#LNFLAGS := -Wl,--gc-sections  -nostartfiles
LNFLAGS := -Wl,--gc-sections -Wl,--entry=_start -Xlinker
# Find any linker scripts in the sources directory
LNSCRIPTS := $(foreach dir,$(SRC_DIRS),$(wildcard $(dir)/*.ld))
# Add scripts to the linker settings
LNFLAGS += $(foreach lds,$(LNSCRIPTS),-dT "$(lds)") 
# Add libraries required for builds
LNLIBS += -lft900 -lc -lstub

# FreeRTOS Makefile definitions
ifneq ($(USE_FREERTOS),$(null))
# Use the builtin crt0.S from FreeRTOS by default
# Add a line "USE_FREERTOS_CRT0 := false" to use a different crt0 source file
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

# Tinyprintf Makefile definitions
ifneq ($(USE_TINYPRINTF),$(null))
# Add tinyprintf files source file list
SRCS += $(USE_TINYPRINTF)/tinyprintf.c
# Add tinyprintf include paths to the compiler flags
CPPFLAGS += -I$(USE_TINYPRINTF)
endif

# Set build directory for output
BUILD_DIR := FT900_$(CONFIG)
# Set object file directory within build directory
OBJDIR := $(BUILD_DIR)/obj

# Generate object file list for *.c files in source list
OBJS     := $(patsubst %.c,$(OBJDIR)/%.o,$(SRCS))
# Generate object file list for *.S files in source list
OBJS     := $(patsubst %.S,$(OBJDIR)/%.o,$(OBJS))
# Generate dependency list from object file list
DEPS     := $(OBJS:.o=.d)
# Add include files for local include directories to flags
CPPFLAGS += $(addprefix -I,$(INC_DIRS)) -Wall 

# Targets
.PHONY: all clean
	
all: $(BUILD_DIR)/$(TARGET).bin
	@echo 'Building target: $(TARGET)'

# Generate Flash file (.bin) for programming
$(BUILD_DIR)/$(TARGET).bin: $(BUILD_DIR)/$(TARGET).elf
	@echo 'Invoking: FT90x Flash File Generator'
	$(OBJCOPY) --output-target binary "$<" "$@"
	@echo 'Finished building: $<'
	@echo 'Invoking: FT90x Display Image Size'
	$(SIZE) --format=berkeley -x "$<"
	@echo 'Finsihed building: SIZE'

# Link object files into output program (.elf)
$(BUILD_DIR)/$(TARGET).elf: $(OBJS)
	@echo 'Building target: $@'
	@echo 'Invoking: FT90x GCC Linker'
	$(CPP) $(LNFLAGS) $(OBJS) $(LNLIBS) -o "$@" 
	@echo 'Finished building: $@'

# Compile C source files (.c) into object files (.o)
# Create a target directory for the object files
$(OBJDIR)/%.o: %.c 
	@echo 'Building file: $<'
	@echo 'Invoking: FT90x GCC Compiler'
ifeq ($(DETECTED_OS),Windows)
	@IF NOT EXIST "$(subst /,\,$(dir $@))" MKDIR "$(subst /,\,$(dir $@))" || true
else
	@mkdir -p $(dir $@)
endif
	$(CPP) $(CPPFLAGS) -MMD -MP -MF"$(patsubst %.o,%.d,$@)" -MT"$@" -o "$@" -c $<
	@echo 'Finished building: $<'

# Compile assembler source files (.S) into object files (.o)
# Create a target directory for the object files
$(OBJDIR)/%.o: %.S 
	@echo 'Building file: $<'
	@echo 'Invoking: FT90x GCC Assembler'
ifeq ($(DETECTED_OS),Windows)
	@IF NOT EXIST "$(subst /,\,$(dir $@))" MKDIR "$(subst /,\,$(dir $@))" || true
else
	@mkdir -p $(dir $@)
endif
	$(AS) --defsym __FT900__=1 -o "$@" "$<"
	@echo 'Finished building: $<'

# Clean the output directory
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
