cmake_minimum_required(VERSION 3.16)
project(photo-print VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)
FetchContent_Declare(
  webview
  GIT_REPOSITORY https://github.com/webview/webview
  GIT_TAG 0.12.0
)
FetchContent_Declare(
  nlohmann_json
  GIT_REPOSITORY https://github.com/nlohmann/json.git
  GIT_TAG v3.11.3
)
FetchContent_MakeAvailable(webview nlohmann_json)

add_executable(photo-print src/main.mm src/bridge.mm src/printer_macos.mm)
target_link_libraries(photo-print PRIVATE webview::core nlohmann_json::nlohmann_json)

if(APPLE)
  find_library(COCOA_LIBRARY Cocoa)
  find_library(WEBKIT_LIBRARY WebKit)
  target_link_libraries(photo-print PRIVATE ${COCOA_LIBRARY} ${WEBKIT_LIBRARY} "-lcups")

  target_link_options(photo-print PRIVATE
    "-sectcreate" "__TEXT" "__info_plist" "${CMAKE_CURRENT_SOURCE_DIR}/Info.plist"
  )
endif()
