const deleteProduct = (btn) => {
  const productId = btn.parentNode.querySelector('[name=productId]').value

  const parentElement = btn.closest('article')

  fetch('/admin/product/' + productId, {
    method: 'DELETE',
  })
    .then((result) => {
      return result.json()
    })
    .then((data) => {
      console.log(data)
      parentElement.parentNode.removeChild(parentElement)
    })
    .catch((err) => {
      console.log(err)
    })
}
