import React, { useRef, useEffect } from "react";
import { Modal, View, TouchableOpacity, Text } from "react-native";
import { WebView } from "react-native-webview";

interface Props {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onCropped: (croppedUri: string) => void;
}

export default function CropperModal({
  visible,
  imageUri,
  onClose,
  onCropped,
}: Props) {
  const webViewRef = useRef<WebView>(null);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body, html { margin: 0; padding: 0; height: 100%; background: #000; }
          #crop-container {
            width: 100%;
            height: 80%;
            background: #000;
            overflow: hidden;
            position: relative;
          }

          /* Circle overlay */
          #overlay {
            position: absolute;
            top: 50%; 
            left: 50%;
            transform: translate(-50%, -50%);
            width: 70vw;
            height: 70vw;
            border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.9);
            pointer-events: none;
            box-shadow: 0 0 0 9999px rgba(0,0,0,0.5);
          }
        </style>

        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.css"
          rel="stylesheet"
        />
      </head>

      <body>
        <div id="crop-container">
          <img id="image" src="${imageUri}" style="max-width: 100%; display:block;" />
          <div id="overlay"></div>
        </div>

        <!-- Buttons -->
        <div style="height: 20%; display:flex; justify-content:center; align-items:center; gap:20px;">
          <button onclick="crop()" 
            style="padding:12px 20px; font-size:18px; border-radius:8px; background:#007bff; color:#fff;">
            Crop & Save
          </button>
        </div>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.js"></script>

        <script>
          var cropper;

          window.onload = function () {
            var image = document.getElementById('image');

            cropper = new Cropper(image, {
              aspectRatio: 1,
              viewMode: 1,
              dragMode: 'move',
              background: false,
              guides: false,
              movable: true,
              rotatable: false,
              scalable: false,
              zoomable: true,
            });
          };

          function crop() {
            const canvas = cropper.getCroppedCanvas({ width: 700, height: 700 });
            const base64 = canvas.toDataURL("image/jpeg", 0.9);
            window.ReactNativeWebView.postMessage(JSON.stringify({ base64 }));
          }
        </script>
      </body>
    </html>
  `;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1 }}>
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html }}
          onMessage={(event) => {
            const data = JSON.parse(event.nativeEvent.data);
            const base64 = data.base64;

            // Convert base64 → RN file URI
            onCropped(base64);
          }}
        />

        <TouchableOpacity
          onPress={onClose}
          style={{
            padding: 14,
            backgroundColor: "#333",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 16 }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
