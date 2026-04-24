export const Validations = {

    /** 
     * Validates that the given user can create an instance.
     * 
     * @param user The HMSUser to validate.
     */
    CanUserCreateInstace: 'can-user-create-instance',

    /** 
     * Validates that the given user can join the given instance.
     * 
     * @param user The HMSUser to validate.
     * @param instance The game instance to validate.
     */
    CanUserJoinInstace: 'can-user-join-instance',

    /** 
     * Validates that the given user can see the given instance.
     * 
     * @param user The HMSUser to validate.
     * @param instance The game instance to validate.
     */
    CanUserSeeInstace: 'can-user-see-instance',

    /**
     * Validates that the given user can create the game instances.
     * 
     * @param user The HMSUser to validate.
     * @param instance The game instance to validate.
     */
    CanUserOperateInstace: 'can-user-operate-instance'
};