import React from 'react'
import { FiAlertTriangle } from 'react-icons/fi'

const SafeIcon = ({ icon: IconComponent, className = "", ...props }) => {
  if (!IconComponent) {
    return <FiAlertTriangle className={className} {...props} />
  }
  
  return <IconComponent className={className} {...props} />
}

export default SafeIcon