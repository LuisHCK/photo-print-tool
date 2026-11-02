cmake_minimum_required(VERSION 3.16)

# Universal macOS build defaults. Set before project() so compiler detection
# picks them up. Override with -DCMAKE_OSX_ARCHITECTURES / -DCMAKE_OSX_DEPLOYMENT_TARGET.
if(APPLE)
  if(NOT CMAKE_OSX_DEPLOYMENT_TARGET)
    set(CMAKE_OSX_DEPLOYMENT_TARGET "13.0" CACHE STRING "Minimum macOS deployment target")
  endif()
  if(NOT CMAKE_OSX_ARCHITECTURES)
    set(CMAKE_OSX_ARCHITECTURES "arm64;x86_64" CACHE STRING "Target architectures")
  endif()
endif()

if(NOT PHOTO_PRINT_VERSION)
  set(PHOTO_PRINT_VERSION "1.0.0")
endif()

project(photo-print VERSION ${PHOTO_PRINT_VERSION} LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)
# Use release tarballs instead of git clones: full git history for these
# repos is >150 MiB and makes clean builds slow and quiet.
FetchContent_Declare(
  webview
  URL https://github.com/webview/webview/archive/refs/tags/0.12.0.tar.gz
  DOWNLOAD_EXTRACT_TIMESTAMP TRUE
)
FetchContent_Declare(
  nlohmann_json
  URL https://github.com/nlohmann/json/releases/download/v3.11.3/json.tar.xz
  DOWNLOAD_EXTRACT_TIMESTAMP TRUE
)
FetchContent_MakeAvailable(webview nlohmann_json)

# ---------------------------------------------------------------------------
# Third-party warning cleanup
# ---------------------------------------------------------------------------
# webview 0.12 uses Objective-C++ constructs that modern Apple clang reports as
# deprecated literal operators and 'auto' deduced to 'id'. These are upstream
# warnings, so silence them for webview and for our sources that include its
# header. First-party warnings stay enabled.
if(APPLE AND CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  set(WEBVIEW_WARNING_SUPPRESSIONS
    -Wno-unknown-warning-option
    -Wno-deprecated-literal-operator
    -Wno-auto-var-id)

  foreach(target webview_core_static webview_core_shared)
    if(TARGET ${target})
      target_compile_options(${target} PRIVATE ${WEBVIEW_WARNING_SUPPRESSIONS})
    endif()
  endforeach()
else()
  set(WEBVIEW_WARNING_SUPPRESSIONS "")
endif()

if(APPLE)
  set(PLATFORM_SOURCES src/printer_macos.mm)
elseif(WIN32)
  set(PLATFORM_SOURCES src/printer_win.cpp)
elseif(UNIX)
  set(PLATFORM_SOURCES src/printer_linux.cpp)
endif()

if(APPLE)
  add_executable(photo-print MACOSX_BUNDLE src/main.mm src/bridge.mm ${PLATFORM_SOURCES})
else()
  add_executable(photo-print src/main.mm src/bridge.mm ${PLATFORM_SOURCES})
endif()

target_link_libraries(photo-print PRIVATE webview::core nlohmann_json::nlohmann_json)
target_compile_options(photo-print PRIVATE ${WEBVIEW_WARNING_SUPPRESSIONS})

if(CMAKE_CXX_COMPILER_ID MATCHES "Clang|GNU")
  target_compile_options(photo-print PRIVATE -Wall -Wextra)
endif()

if(APPLE)
  find_library(COCOA_LIBRARY Cocoa)
  find_library(WEBKIT_LIBRARY WebKit)
  target_link_libraries(photo-print PRIVATE ${COCOA_LIBRARY} ${WEBKIT_LIBRARY} "-lcups")

  set_target_properties(photo-print PROPERTIES
    MACOSX_BUNDLE_BUNDLE_NAME "Photo Print Tool"
    MACOSX_BUNDLE_GUI_IDENTIFIER "dev.luisjcenteno.photoprint"
    MACOSX_BUNDLE_INFO_PLIST "${CMAKE_CURRENT_SOURCE_DIR}/Info.plist.in"
    MACOSX_BUNDLE_ICON_FILE "AppIcon"
    MACOSX_BUNDLE_SHORT_VERSION_STRING "${PROJECT_VERSION}"
    MACOSX_BUNDLE_BUNDLE_VERSION "${PROJECT_VERSION}"
  )
endif()
