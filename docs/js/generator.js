var baseUrl = "https://imagecdn.app";
var apiRoot = "/v1/images/";

// Generate an image URL
function generateImage(e) {
  if (e) e.preventDefault()

  var formState = getFormState()
  var outputImage = document.querySelector('#output-image')
  var outputUrl = document.querySelector('#output-url')

  var params = []

  if (formState.width) params.push('width='+formState.width)
  if (formState.height) params.push('height='+formState.height)

  // URL *must* always contain image, so generate a default one here.
  // Append any additional params afterwards.
  var url = baseUrl+apiRoot+encodeURIComponent(formState.image)
  if (params.length > 0) url = url+"?"+params.join('&')

  outputImage.src = outputUrl.innerText = url
}

// Retrieve a pointer to the form.
function getForm() {
  return document.querySelector('#form-generate-image')
}
// Flatten form state into a simple object.
function getFormState() {
  return Array.prototype.slice.call(getForm().querySelectorAll('input'))
    .reduce(function (formState, input) {
      formState[input.name] = input.value
      return formState
    }, new Object)
}

document.addEventListener('DOMContentLoaded', function() {
  generateImage()
  getForm().addEventListener('submit', generateImage)
})
